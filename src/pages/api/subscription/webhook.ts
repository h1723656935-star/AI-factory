import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null

export const config = {
  api: {
    bodyParser: false,
  },
}

function buffer(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }

  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return res.status(400).json({ error: message })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (userId && planId) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              provider_subscription_id: session.subscription as string,
              start_date: new Date().toISOString(),
            })
            .eq('provider_subscription_id', session.id)

          await supabase.from('profiles').update({ role: planId }).eq('id', userId)
          await supabase.from('user_history').insert({
            user_id: userId,
            action_type: 'subscription',
            title: '订阅成功',
            description: `开通 ${planId} 会员套餐`,
            metadata: { provider: 'stripe', sessionId: session.id },
          })
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('provider_subscription_id', subscription.id)
          .single()

        if (data?.user_id) {
          await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('provider_subscription_id', subscription.id)
          await supabase.from('profiles').update({ role: 'free' }).eq('id', data.user_id)
        }
        break
      }
      default:
        break
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'Webhook handler failed' })
  }
}
