import { LRUCache, cacheAside } from '@/lib/cache'

describe('LRUCache', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    cache = new LRUCache<string>({ maxSize: 3, defaultTtlMs: 1000 })
  })

  it('sets and gets values', () => {
    cache.set('a', 'value-a')
    expect(cache.get('a')).toBe('value-a')
  })

  it('returns undefined for missing keys', () => {
    expect(cache.get('nope')).toBeUndefined()
  })

  it('expires values after TTL', async () => {
    cache.set('a', 'value-a', 50)
    expect(cache.get('a')).toBe('value-a')
    await new Promise((r) => setTimeout(r, 80))
    expect(cache.get('a')).toBeUndefined()
  })

  it('evicts least recently used when over capacity', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.get('a') // a is most recent
    cache.set('d', '4') // should evict b

    expect(cache.get('a')).toBe('1')
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('c')).toBe('3')
    expect(cache.get('d')).toBe('4')
  })

  it('tracks hit/miss statistics', () => {
    cache.set('a', '1')
    cache.get('a')
    cache.get('a')
    cache.get('b')
    const stats = cache.getStats()
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBeCloseTo(2 / 3)
  })

  it('clears all entries', () => {
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size()).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })
})

describe('cacheAside', () => {
  it('returns cached value on hit', async () => {
    const cache = new LRUCache<string>({ maxSize: 10, defaultTtlMs: 1000 })
    const loader = jest.fn().mockResolvedValue('fresh')

    const v1 = await cacheAside(cache, 'k', undefined, loader)
    const v2 = await cacheAside(cache, 'k', undefined, loader)

    expect(v1).toBe('fresh')
    expect(v2).toBe('fresh')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('calls loader on miss', async () => {
    const cache = new LRUCache<string>({ maxSize: 10, defaultTtlMs: 1000 })
    const loader = jest.fn().mockResolvedValue('value')

    const v = await cacheAside(cache, 'missing', undefined, loader)
    expect(v).toBe('value')
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
