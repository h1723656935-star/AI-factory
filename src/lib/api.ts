/**
 * 统一错误处理与遥测中间件
 * - 标准化错误响应
 * - 自动生成 requestId 并埋点
 * - 区分业务错误与系统错误
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { logger, generateRequestId, LogContext } from './logger'

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = '未授权，请先登录') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = '权限不足') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends ApiError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ValidationFailedError extends ApiError {
  constructor(message = '请求参数错误', details?: unknown) {
    super(message, 400, 'VALIDATION_FAILED', details)
  }
}

export class RateLimitError extends ApiError {
  public readonly retryAfter: number

  constructor(retryAfter: number, message = '请求过于频繁') {
    super(message, 429, 'RATE_LIMITED')
    this.retryAfter = retryAfter
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(service: string) {
    super(`${service} 未配置或不可用`, 503, 'SERVICE_UNAVAILABLE')
  }
}

export function errorResponse(
  res: NextApiResponse,
  message: string,
  status = 500,
  code = 'INTERNAL_ERROR',
  details?: unknown
) {
  return res.status(status).json({
    error: {
      message,
      code,
      details,
    },
  })
}

export function successResponse<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json({ data })
}

/**
 * 标准请求体验证：抛出 ValidationFailedError 以便统一捕获
 */
export function validateBody<T>(req: NextApiRequest, schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } }): T {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const issues = (result.error?.issues || []).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new ValidationFailedError(issues || '请求参数错误', result.error?.issues)
  }
  return result.data as T
}

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

/**
 * 统一的 API 包装器：自动添加 requestId、性能埋点、错误处理
 */
export function withApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse, ctx: { requestId: string }) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = (req.headers['x-request-id'] as string) || generateRequestId()
    res.setHeader('X-Request-Id', requestId)

    const start = Date.now()
    const baseContext: LogContext = {
      requestId,
      method: req.method,
      path: req.url,
      ip: getClientIp(req),
    }

    try {
      await handler(req, res, { requestId })
      const durationMs = Date.now() - start
      const statusCode = res.statusCode
      logger.info('api_request', { ...baseContext, statusCode, durationMs })

      if (statusCode >= 500) {
        logger.error('api_server_error', { ...baseContext, statusCode, durationMs })
      }
    } catch (err) {
      const durationMs = Date.now() - start

      if (err instanceof ApiError) {
        logger.warn('api_business_error', { ...baseContext, statusCode: err.statusCode, code: err.code, durationMs })
        return errorResponse(res, err.message, err.statusCode, err.code, err.details)
      }

      logger.error('api_unhandled_error', { ...baseContext, durationMs }, err)
      return errorResponse(res, '服务器内部错误', 500, 'INTERNAL_ERROR')
    }
  }
}

/**
 * Supabase 服务端客户端
 * 仅在 SUPABASE 配置齐全时返回有效实例
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function createRouteClient(req: NextApiRequest): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  // dynamic require to avoid pulling supabase into client bundle
  const { createClient } = require('@supabase/supabase-js')
  const authHeader = req.headers.authorization
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { persistSession: false },
  })
}

export async function getCurrentUser(req: NextApiRequest): Promise<{ id: string; email: string; role: UserRole; name: string; avatar_url: string } | null> {
  const supabase = createRouteClient(req)
  if (!supabase) return null

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, avatar_url')
    .eq('id', data.user.id)
    .single()

  return {
    id: data.user.id,
    email: data.user.email || '',
    role: (profile?.role as UserRole) || 'free',
    name: profile?.name || data.user.email?.split('@')[0] || '',
    avatar_url: profile?.avatar_url || '',
  }
}

export function requireAuth(req: NextApiRequest, res: NextApiResponse): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader || typeof authHeader !== 'string') {
    errorResponse(res, 'Unauthorized', 401, 'UNAUTHORIZED')
    return null
  }
  return authHeader
}

/**
 * 兼容性保留：与旧版 withErrorHandler 等价
 */
export const withErrorHandler = withApiHandler

export const ValidationError = ValidationFailedError
