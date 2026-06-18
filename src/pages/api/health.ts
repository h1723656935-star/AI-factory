/**
 * 健康检查接口
 * GET /api/health
 * 用于负载均衡、k8s liveness/readiness 探针
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { successResponse, errorResponse, withApiHandler } from '@/lib/api'
import { getSystemHealth } from '@/lib/health'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient()
  const health = await getSystemHealth(
    supabase
      ? async () => {
          const { error } = await supabase.from('pricing_plans').select('id').limit(1)
          if (error) throw error
        }
      : undefined
  )

  const statusCode = health.status === 'unhealthy' ? 503 : 200
  if (statusCode !== 200) {
    return errorResponse(res, 'Service unhealthy', statusCode, 'SERVICE_UNHEALTHY', health)
  }
  return successResponse(res, health, statusCode)
}

export default withApiHandler(handler)
