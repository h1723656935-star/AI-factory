import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { roleMeetsRequired } from '@/lib/auth'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  requiredRole?: UserRole
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ requiredRole = 'free', fallback, children }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (!roleMeetsRequired(user.role, requiredRole)) {
      router.push('/pricing')
    }
  }, [user, loading, requiredRole, router])

  if (loading || !user || !roleMeetsRequired(user.role, requiredRole)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
