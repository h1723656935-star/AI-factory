import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { errorResponse, successResponse } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return successResponse(res, {
      id: 'demo-sub-001',
      plan_id: 'premium',
      plan_name: '高级版',
      status: 'active',
      created_at: new Date().toISOString(),
    })
  }

  try {
    const { planId, paymentMethod } = req.body

    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('name')
      .eq('id', planId)
      .single()

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        plan_id: planId,
        plan_name: plan?.name || '',
        status: 'pending',
        payment_method: paymentMethod,
        start_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return errorResponse(res, error.message, 500)
    }

    return successResponse(res, data)
  } catch {
    return errorResponse(res, 'Internal server error', 500)
  }
}
