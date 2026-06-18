import type { UserRole } from '@/types'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
  admin: 99,
}

export function roleMeetsRequired(role: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required]
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isPaidUser(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.basic
}

export function isPremiumUser(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.premium
}
