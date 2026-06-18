import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser, errorResponse, successResponse, withErrorHandler } from '@/lib/api'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null

const priceMap: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || '',
  premium: process.env.STRIPE_PRICE_PREMIUM || '',
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  const { planId } = req.body
  if (!planId || !priceMap[planId]) {
    return errorResponse(res, 'Invalid plan', 400)
  }

  const user = await getCurrentUser(req)
  if (!user) {
    return errorResponse(res, 'Unauthorized', 401)
  }

  if (!stripe) {
    return errorResponse(res, 'Stripe not configured', 503)
  }

  const supabase = createAdminClient()
  const origin = req.headers.origin || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [
      {
        price: priceMap[planId],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${origin}/dashboard?subscription=success`,
    cancel_url: `${origin}/pricing?subscription=cancelled`,
    metadata: {
      userId: user.id,
      planId,
    },
  })

  if (supabase && session.id) {
    try {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: planId,
        status: 'pending',
        payment_provider: 'stripe',
        provider_subscription_id: session.id,
      })
    } catch {
      // 非阻断错误
    }
  }

  return successResponse(res, { url: session.url })
}

export default withErrorHandler(handler)
