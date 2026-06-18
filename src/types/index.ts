export type UserRole = 'free' | 'basic' | 'premium' | 'enterprise' | 'admin'

export interface UserPreferences {
  theme?: 'dark' | 'light'
  notifications?: boolean
  language?: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role: UserRole
  preferences?: UserPreferences
  created_at: string
  updated_at?: string
}

export interface VideoAnalysis {
  id: string
  user_id?: string
  video_url: string
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu' | 'bilibili' | 'youtube' | 'unknown'
  status: 'pending' | 'processing' | 'complete' | 'error'
  title_analysis?: {
    mainTitle: string
    subTitle: string
    keywords: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  emotional_hooks?: EmotionalHook[]
  conflict_points?: ConflictPoint[]
  reversal_points?: ReversalPoint[]
  created_at: string
}

export interface EmotionalHook {
  type: string
  strength: number
  content: string
}

export interface ConflictPoint {
  timestamp: string
  description: string
  intensity: number
}

export interface ReversalPoint {
  timestamp: string
  content: string
  impact: number
}

export interface Script {
  id: string
  analysis_id?: string
  user_id?: string
  content: string
  style: string
  tone?: string
  length: 'short' | 'medium' | 'long'
  scene_count?: number
  estimated_duration?: string
  created_at: string
}

export interface StoryboardFrame {
  id: string
  sceneNumber: number
  description: string
  visualPrompt: string
  duration: string
}

export interface Storyboard {
  id: string
  script_id?: string
  user_id?: string
  frames: StoryboardFrame[]
  style?: string
  created_at: string
}

export interface Prompt {
  id: string
  user_id?: string
  platform: string
  subject: string
  style: string
  details?: string
  negative_prompt?: string
  generated_prompt: string
  aspect_ratio?: string
  created_at: string
}

export interface HistoryItem {
  id: string
  user_id?: string
  action_type: 'analysis' | 'script' | 'storyboard' | 'prompt' | 'subscription' | 'login' | 'other'
  title: string
  description?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  original_price?: number
  period: 'month' | 'year' | 'lifetime'
  description?: string
  features: string[]
  is_active?: boolean
  priority?: number
  is_recommended?: boolean
  created_at?: string
}

export interface Subscription {
  id: string
  user_id?: string
  plan_id?: string
  plan_name: string
  status: 'active' | 'pending' | 'cancelled' | 'expired'
  payment_method?: string
  start_date?: string
  end_date?: string
  created_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
