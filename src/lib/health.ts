/**
 * 健康检查与监控指标
 */
import { LRUCache, globalCache } from './cache'

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  uptime: number
  timestamp: string
  version: string
  checks: {
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
    durationMs: number
  }[]
  cache: ReturnType<LRUCache['getStats']>
}

const SERVICE_START_TIME = Date.now()
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0'

async function timed<T>(name: string, fn: () => Promise<T> | T): Promise<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string; durationMs: number }> {
  const start = Date.now()
  try {
    const result = await fn()
    const durationMs = Date.now() - start
    if (durationMs > 1000) {
      return { name, status: 'warn', message: '响应较慢', durationMs }
    }
    return { name, status: 'pass', message: typeof result === 'string' ? result : 'ok', durationMs }
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    }
  }
}

export async function getSystemHealth(supabaseCheck?: () => Promise<void>): Promise<SystemHealth> {
  const checks: SystemHealth['checks'] = []

  checks.push(await timed('memory', () => {
    const used = process.memoryUsage()
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024)
    if (heapUsedMB > 512) throw new Error(`Heap 使用过高: ${heapUsedMB}MB`)
    return `Heap ${heapUsedMB}MB`
  }))

  checks.push(await timed('event-loop', async () => {
    const start = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 0))
    const delay = Date.now() - start
    if (delay > 100) throw new Error(`Event loop 延迟过高: ${delay}ms`)
    return `延迟 ${delay}ms`
  }))

  if (supabaseCheck) {
    checks.push(await timed('supabase', supabaseCheck))
  }

  const hasFail = checks.some((c) => c.status === 'fail')
  const hasWarn = checks.some((c) => c.status === 'warn')
  const status: SystemHealth['status'] = hasFail ? 'unhealthy' : hasWarn ? 'degraded' : 'healthy'

  return {
    status,
    uptime: Math.round((Date.now() - SERVICE_START_TIME) / 1000),
    timestamp: new Date().toISOString(),
    version: SERVICE_VERSION,
    checks,
    cache: globalCache.getStats(),
  }
}

export function getCacheStats() {
  return globalCache.getStats()
}
