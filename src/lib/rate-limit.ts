import { NextApiRequest, NextApiResponse } from 'next'
import { getClientIp } from './api'

interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * 内存式滑动窗口速率限制器
 * 适用于开发环境和小规模部署，生产环境建议使用 Redis
 */
class RateLimiter {
  private requests = new Map<string, RateLimitEntry>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 60, windowMs = 60 * 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || now > entry.resetTime) {
      // 新窗口
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    entry.count += 1
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

// 通用 API 限流：默认 60 次/分钟
const defaultLimiter = new RateLimiter(
  Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  60 * 1000
)

// AI 生成类 API 限流：更严格，20 次/分钟
const aiLimiter = new RateLimiter(20, 60 * 1000)

export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  type: 'default' | 'ai' = 'default'
): boolean {
  const identifier = `${getClientIp(req)}:${req.url}`
  const limiter = type === 'ai' ? aiLimiter : defaultLimiter
  const result = limiter.check(identifier)

  res.setHeader('X-RateLimit-Limit', type === 'ai' ? 20 : (Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60))
  res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining))
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000))

  if (!result.allowed) {
    res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    })
    return false
  }

  return true
}

export { RateLimiter }
