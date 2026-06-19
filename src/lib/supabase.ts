import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createSupabaseClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'anon-key'
    )
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'anon-key'
    )
  }

  return browserClient
}

export function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl) return null
  return createSupabaseClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey || 'service-role-key')
}

// 服务端客户端 - 使用 service role key，绕过 RLS
export function createServiceClient(): SupabaseClient | null {
  if (!supabaseUrl) return null
  if (!supabaseServiceKey) {
    // Fallback to admin client if service key not configured
    return createAdminClient()
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey)
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export const supabase = createClient()
