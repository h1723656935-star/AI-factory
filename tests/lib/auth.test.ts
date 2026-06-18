import { roleMeetsRequired, isAdmin, isPaidUser, isPremiumUser, ROLE_HIERARCHY } from '@/lib/auth'

describe('role helpers', () => {
  it('free does not meet basic', () => {
    expect(roleMeetsRequired('free', 'basic')).toBe(false)
  })

  it('premium meets basic', () => {
    expect(roleMeetsRequired('premium', 'basic')).toBe(true)
  })

  it('admin meets everything', () => {
    expect(roleMeetsRequired('admin', 'enterprise')).toBe(true)
    expect(roleMeetsRequired('admin', 'premium')).toBe(true)
  })

  it('isAdmin only true for admin', () => {
    expect(isAdmin('admin')).toBe(true)
    expect(isAdmin('premium')).toBe(false)
  })

  it('isPaidUser true for basic+', () => {
    expect(isPaidUser('free')).toBe(false)
    expect(isPaidUser('basic')).toBe(true)
    expect(isPaidUser('premium')).toBe(true)
    expect(isPaidUser('enterprise')).toBe(true)
  })

  it('isPremiumUser true for premium+', () => {
    expect(isPremiumUser('premium')).toBe(true)
    expect(isPremiumUser('enterprise')).toBe(true)
    expect(isPremiumUser('basic')).toBe(false)
  })

  it('ROLE_HIERARCHY is monotonically increasing', () => {
    expect(ROLE_HIERARCHY.free).toBeLessThan(ROLE_HIERARCHY.basic)
    expect(ROLE_HIERARCHY.basic).toBeLessThan(ROLE_HIERARCHY.premium)
    expect(ROLE_HIERARCHY.premium).toBeLessThan(ROLE_HIERARCHY.enterprise)
    expect(ROLE_HIERARCHY.enterprise).toBeLessThan(ROLE_HIERARCHY.admin)
  })
})
