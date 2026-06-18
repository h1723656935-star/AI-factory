import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { errorResponse, successResponse } from '@/lib/api'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient()

  if (!supabase) {
    return successResponse(res, {
      id: 'demo-user-001',
      email: 'demo@baokuan.ai',
      name: '爆款体验官',
      role: 'premium',
      avatar_url: '',
      preferences: { theme: 'dark', notifications: true, language: 'zh-CN' },
    })
  }

  if (req.method === 'GET') {
    try {
      const { userId } = req.query

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return errorResponse(res, error.message, 500)
      }

      return successResponse(res, data)
    } catch {
      return errorResponse(res, 'Internal server error', 500)
    }
  } else if (req.method === 'PUT') {
    try {
      const { userId, updates } = req.body

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return errorResponse(res, error.message, 500)
      }

      return successResponse(res, data)
    } catch {
      return errorResponse(res, 'Internal server error', 500)
    }
  } else {
    return errorResponse(res, 'Method not allowed', 405)
  }
}
