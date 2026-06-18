import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { getCurrentUser, errorResponse, successResponse } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  const user = await getCurrentUser(req)
  if (!user) {
    return errorResponse(res, 'Unauthorized', 401)
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return successResponse(res, {
      role: user.role || 'premium',
      subscription: {
        id: 'demo-sub-001',
        plan_id: 'premium',
        plan_name: '高级版',
        status: 'active',
      },
    })
  }

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return successResponse(res, {
      role: user.role,
      subscription,
    })
  } catch {
    return successResponse(res, { role: user.role, subscription: null })
  }
}
