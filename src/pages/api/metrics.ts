/**
 * Prometheus 兼容的指标接口
 * GET /api/metrics
 * 输出 text/plain 格式指标
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { globalCache } from '@/lib/cache'
import { withApiHandler } from '@/lib/api'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cacheStats = globalCache.getStats()
  const mem = process.memoryUsage()
  const lines: string[] = []

  lines.push('# HELP baokuan_uptime_seconds Service uptime in seconds')
  lines.push('# TYPE baokuan_uptime_seconds gauge')
  lines.push(`baokuan_uptime_seconds ${Math.round(process.uptime())}`)

  lines.push('# HELP baokuan_cache_hits_total Total cache hits')
  lines.push('# TYPE baokuan_cache_hits_total counter')
  lines.push(`baokuan_cache_hits_total ${cacheStats.hits}`)

  lines.push('# HELP baokuan_cache_misses_total Total cache misses')
  lines.push('# TYPE baokuan_cache_misses_total counter')
  lines.push(`baokuan_cache_misses_total ${cacheStats.misses}`)

  lines.push('# HELP baokuan_cache_size Current cache size')
  lines.push('# TYPE baokuan_cache_size gauge')
  lines.push(`baokuan_cache_size ${cacheStats.size}`)

  lines.push('# HELP baokuan_cache_evictions_total Total cache evictions')
  lines.push('# TYPE baokuan_cache_evictions_total counter')
  lines.push(`baokuan_cache_evictions_total ${cacheStats.evictions}`)

  lines.push('# HELP baokuan_memory_heap_used_bytes Process heap used')
  lines.push('# TYPE baokuan_memory_heap_used_bytes gauge')
  lines.push(`baokuan_memory_heap_used_bytes ${mem.heapUsed}`)

  lines.push('# HELP baokuan_memory_rss_bytes Process resident set size')
  lines.push('# TYPE baokuan_memory_rss_bytes gauge')
  lines.push(`baokuan_memory_rss_bytes ${mem.rss}`)

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).send(lines.join('\n'))
}

export default withApiHandler(handler)

export const config = {
  api: {
    bodyParser: false,
  },
}
