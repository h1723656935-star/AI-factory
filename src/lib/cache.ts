/**
 * 轻量级 LRU 内存缓存
 * - 支持 TTL 过期
 * - LRU 淘汰策略
 * - 命中统计
 * 生产环境建议替换为 Redis
 */

interface CacheNode<T> {
  key: string
  value: T
  expiresAt: number
  prev: CacheNode<T> | null
  next: CacheNode<T> | null
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
  size: number
  hitRate: number
}

export interface CacheOptions {
  maxSize?: number
  defaultTtlMs?: number
}

export class LRUCache<T = unknown> {
  private map = new Map<string, CacheNode<T>>()
  private head: CacheNode<T> | null = null
  private tail: CacheNode<T> | null = null
  private maxSize: number
  private defaultTtlMs: number
  private hits = 0
  private misses = 0
  private sets = 0
  private evictions = 0

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 500
    this.defaultTtlMs = options.defaultTtlMs ?? 60 * 1000
  }

  get(key: string): T | undefined {
    const node = this.map.get(key)
    if (!node) {
      this.misses += 1
      return undefined
    }
    if (Date.now() > node.expiresAt) {
      this.removeNode(node)
      this.map.delete(key)
      this.misses += 1
      return undefined
    }
    this.moveToFront(node)
    this.hits += 1
    return node.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs)
    const existing = this.map.get(key)
    if (existing) {
      existing.value = value
      existing.expiresAt = expiresAt
      this.moveToFront(existing)
      this.sets += 1
      return
    }

    const node: CacheNode<T> = { key, value, expiresAt, prev: null, next: null }
    this.map.set(key, node)
    this.attachToFront(node)
    this.sets += 1

    if (this.map.size > this.maxSize) {
      if (this.tail) {
        this.map.delete(this.tail.key)
        this.detachNode(this.tail)
        this.evictions += 1
      }
    }
  }

  delete(key: string): boolean {
    const node = this.map.get(key)
    if (!node) return false
    this.removeNode(node)
    this.map.delete(key)
    return true
  }

  clear(): void {
    this.map.clear()
    this.head = null
    this.tail = null
  }

  size(): number {
    return this.map.size
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      evictions: this.evictions,
      size: this.map.size,
      hitRate: total > 0 ? this.hits / total : 0,
    }
  }

  resetStats(): void {
    this.hits = 0
    this.misses = 0
    this.sets = 0
    this.evictions = 0
  }

  private moveToFront(node: CacheNode<T>): void {
    if (this.head === node) return
    this.detachNode(node)
    this.attachToFront(node)
  }

  private attachToFront(node: CacheNode<T>): void {
    node.prev = null
    node.next = this.head
    if (this.head) this.head.prev = node
    this.head = node
    if (!this.tail) this.tail = node
  }

  private detachNode(node: CacheNode<T>): void {
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev
    if (this.head === node) this.head = node.next
    if (this.tail === node) this.tail = node.prev
    node.prev = null
    node.next = null
  }

  private removeNode(node: CacheNode<T>): void {
    this.detachNode(node)
  }
}

/**
 * 全局共享缓存实例
 */
export const globalCache = new LRUCache<unknown>({ maxSize: 1000, defaultTtlMs: 5 * 60 * 1000 })

/**
 * 缓存装饰器风格包装：cacheAside(key, ttlMs, () => Promise<T>)
 */
export async function cacheAside<T>(
  cache: LRUCache<T>,
  key: string,
  ttlMs: number | undefined,
  loader: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const value = await loader()
  if (value !== undefined && value !== null) {
    cache.set(key, value, ttlMs)
  }
  return value
}
