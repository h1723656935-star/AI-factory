// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { withErrorHandler, errorResponse, successResponse } from '@/lib/api'

const supabase = createAdminClient()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!supabase) {
    // 内存存储 fallback
    const store = (globalThis as any).__promptHistory || []
    return successResponse(res, store)
  }

  const { period, type } = req.query
  let query = supabase
    .from('user_history')
    .select('*')
    .eq('action_type', 'prompt')
    .order('created_at', { ascending: false })
    .limit(50)

  if (period === 'today') {
    query = query.gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
  } else if (period === 'yesterday') {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    query = query.gte('created_at', new Date(yesterday.setHours(0, 0, 0, 0)).toISOString())
      .lt('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
  } else if (period === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    query = query.gte('created_at', weekAgo.toISOString())
  } else if (period === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    query = query.gte('created_at', monthAgo.toISOString())
  }

  const { data, error } = await query
  if (error) return errorResponse(res, error.message, 500)
  return successResponse(res, data || [])
}

export default withErrorHandler(handler)