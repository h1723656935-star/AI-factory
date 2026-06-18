import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { isAdmin, isPaidUser, isPremiumUser, roleMeetsRequired } from '@/lib/auth'
import type { User, UserRole, LoginCredentials, RegisterCredentials } from '@/types'

const MOCK_USER_KEY = 'baokuan_mock_user'

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@baokuan.ai',
  name: '爆款体验官',
  role: 'premium',
  avatar_url: '',
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'zh-CN',
  },
  created_at: new Date().toISOString(),
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function getMockUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function setMockUser(user: User | null): void {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(MOCK_USER_KEY)
  }
}

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  hasRole: (required: UserRole) => boolean
  isAdmin: boolean
  isPaidUser: boolean
  isPremiumUser: boolean
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(getMockUser())
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: sessionData } = await supabase.auth.getSession()

    if (sessionData?.session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single()

      setUser({
        id: sessionData.session.user.id,
        email: sessionData.session.user.email || '',
        name: profile?.name || sessionData.session.user.email?.split('@')[0] || '',
        avatar_url: profile?.avatar_url || '',
        role: profile?.role || 'free',
        preferences: profile?.preferences || { theme: 'dark', notifications: true },
        created_at: sessionData.session.user.created_at || new Date().toISOString(),
      })
    } else {
      setUser(null)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()

    if (!isSupabaseConfigured()) return

    const supabase = createClient()
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshUser()
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [refreshUser])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const mock: User = { ...DEMO_USER, email: credentials.email }
        setMockUser(mock)
        setUser(mock)
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) throw signInError
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const mock: User = {
          ...DEMO_USER,
          email: credentials.email,
          name: credentials.name,
          role: 'free',
        }
        setMockUser(mock)
        setUser(mock)
        return
      }

      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { name: credentials.name },
        },
      })

      if (signUpError) throw signUpError
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    setMockUser(null)

    if (isSupabaseConfigured()) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }

    setUser(null)
    setLoading(false)
  }

  const resetPassword = async (email: string): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return
      }

      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/forgot-password` : undefined,
      })

      if (resetError) throw resetError
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    setError(null)

    try {
      const current = user || getMockUser()
      if (!current) return

      const next: User = { ...current, ...updates }
      setUser(next)
      setMockUser(next)

      if (!isSupabaseConfigured()) return

      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user) return

      await supabase
        .from('profiles')
        .update({
          name: next.name,
          preferences: next.preferences,
        })
        .eq('id', sessionData.session.user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<void> => {
    setError(null)
    setLoading(true)

    try {
      if (!isSupabaseConfigured()) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const mock: User = {
          ...DEMO_USER,
          email: `demo-${provider}@baokuan.ai`,
          name: `${provider} 体验用户`,
        }
        setMockUser(mock)
        setUser(mock)
        return
      }

      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      })

      if (oauthError) throw oauthError
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} 登录失败`)
    } finally {
      setLoading(false)
    }
  }

  const clearError = (): void => setError(null)

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    signInWithOAuth,
    hasRole: (required: UserRole) => (user ? roleMeetsRequired(user.role, required) : false),
    isAdmin: user ? isAdmin(user.role) : false,
    isPaidUser: user ? isPaidUser(user.role) : false,
    isPremiumUser: user ? isPremiumUser(user.role) : false,
    clearError,
  }
}
