import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'

const supabase = createAdminClient()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!applyRateLimit(req, res, 'default')) return

    // 未配置数据库时返回空列表
    if (!supabase) {
      return successResponse(res, {
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      })
    }

    const { type, search, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20))
    const from = (pageNum - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase.from('user_history').select('*', { count: 'exact' })

    if (type && type !== 'all') {
      query = query.eq('action_type', type)
    }

    if (search && typeof search === 'string' && search.trim()) {
      const keyword = search.trim()
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return errorResponse(res, error.message, 500)
    }

    return successResponse(res, {
      items: data,
      pagination: {
        page: pageNum,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    })
  }

  return errorResponse(res, 'Method not allowed', 405)
}

export default withErrorHandler(handler)
