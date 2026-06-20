// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createServiceClient } from '@/lib/supabase'
import { withErrorHandler, errorResponse, successResponse } from '@/lib/api'

const supabase = createServiceClient()

// ==================== 审计日志查询 API ====================

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
  // 关联用户信息
  user_name?: string
  user_email?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  const {
    page = '1',
    limit = '20',
    user_id,
    action,
    resource_type,
    start_date,
    end_date,
    search,
  } = req.query

  const pageNum = parseInt(page as string, 10) || 1
  const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100)
  const offset = (pageNum - 1) * limitNum

  try {
    // 构建查询
    let query = supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        metadata,
        created_at,
        profiles(name, email)
      `, { count: 'exact' })

    // 筛选条件
    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type)
    }
    if (start_date) {
      query = query.gte('created_at', start_date)
    }
    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    // 排序和分页
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1)

    const { data, error, count } = await query

    if (error) throw error

    // 格式化结果
    const logs: AuditLog[] = (data || []).map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      metadata: log.metadata || {},
      created_at: log.created_at,
      user_name: log.profiles?.name || '未知用户',
      user_email: log.profiles?.email || '',
    }))

    // 获取操作类型统计
    const { data: actionStats } = await supabase
      .from('audit_logs')
      .select('action')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const actionCounts: Record<string, number> = {}
    ;(actionStats || []).forEach((log: any) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    // 获取资源类型统计
    const { data: resourceStats } = await supabase
      .from('audit_logs')
      .select('resource_type')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const resourceCounts: Record<string, number> = {}
    ;(resourceStats || []).forEach((log: any) => {
      if (log.resource_type) {
        resourceCounts[log.resource_type] = (resourceCounts[log.resource_type] || 0) + 1
      }
    })

    return successResponse(res, {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
      stats: {
        actions: actionCounts,
        resources: resourceCounts,
      },
    })
  } catch (err) {
    console.error('Audit logs query error:', err)
    return errorResponse(res, '查询审计日志失败', 500)
  }
}

export default withErrorHandler(handler)
