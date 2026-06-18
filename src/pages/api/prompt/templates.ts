/**
 * 提示词模板 API
 * GET  /api/prompt/templates - 获取模板列表
 * POST /api/prompt/templates - 创建模板
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import {
  successResponse,
  errorResponse,
  withApiHandler,
  validateBody,
  ServiceUnavailableError,
} from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { promptTemplateSchema } from '@/lib/schemas'
import { globalCache, cacheAside } from '@/lib/cache'
import { logger } from '@/lib/logger'

const CACHE_KEY = 'prompt_templates:public'
const CACHE_TTL = 5 * 60 * 1000

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!applyRateLimit(req, res, 'default')) return

    const supabase = createAdminClient()
    if (!supabase) {
      return successResponse(res, [])
    }

    try {
      const data = await cacheAside(
        globalCache as never,
        CACHE_KEY,
        CACHE_TTL,
        async () => {
          const { data: rows, error } = await supabase
            .from('prompt_templates')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) throw error
          return rows
        }
      )
      return successResponse(res, data)
    } catch (err) {
      logger.error('prompt_templates_list_failed', { method: 'GET' }, err)
      return errorResponse(res, '获取模板失败', 500, 'LIST_FAILED')
    }
  }

  if (req.method === 'POST') {
    if (!applyRateLimit(req, res, 'default')) return

    const supabase = createAdminClient()
    if (!supabase) {
      throw new ServiceUnavailableError('Supabase')
    }

    const body = validateBody(req, promptTemplateSchema)
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        name: body.name,
        platform: body.platform,
        prompt: body.prompt,
        style: body.style,
        aspect_ratio: body.aspectRatio,
        is_public: body.isPublic,
      })
      .select()
      .single()

    if (error) {
      return errorResponse(res, error.message, 500, 'CREATE_FAILED')
    }

    // 失效模板缓存
    globalCache.delete(CACHE_KEY)
    return successResponse(res, data, 201)
  }

  return errorResponse(res, 'Method not allowed', 405, 'METHOD_NOT_ALLOWED')
}

export default withApiHandler(handler)
