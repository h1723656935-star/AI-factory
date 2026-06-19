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
    targetAudience?: string
    painPoint?: string
    valueProposition?: string
    suggestedHashtags?: string[]
  }
  emotional_hooks?: EmotionalHook[]
  conflict_points?: ConflictPoint[]
  reversal_points?: ReversalPoint[]
  content_structure?: Array<{ segment: string; timestamp: string; purpose: string; keyPoint: string }>
  imitation_plan?: {
    coreIdea: string
    titleFormulas: string[]
    hookTemplates: string[]
    contentFramework: string
    ctaFormula: string
    riskWarnings: string[]
  }
  overall_score?: number
  trend_potential?: string
  raw_metadata?: Record<string, unknown>
  created_at: string
}

export interface EmotionalHook {
  type: string
  strength: number
  content: string
  whyItWorks?: string
}

export interface ConflictPoint {
  timestamp: string
  description: string
  intensity: number
  howToUse?: string
}

export interface ReversalPoint {
  timestamp: string
  content: string
  impact: number
  takeaway?: string
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

export interface PromptQualityScore {
  total: number
  detail: number
  composition: number
  style: number
  platform: number
  suggestions: string[]
  missingItems?: MissingItem[]
}

export interface MissingItem {
  label: string
  description: string
  missing: boolean
  suggestion?: string
}

export interface PromptPlatformParams {
  midjourney?: { ar?: string; stylize?: number; version?: string }
  sdxl?: { cfg?: number; steps?: number; sampler?: string }
}

export interface ImageAnalysis {
  subject: string
  composition: string
  camera: string
  style: string
  colors: string
  lighting: string
  tags: string[]
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
  negative_prompt_full?: string
  aspect_ratio?: string
  camera?: string
  lighting?: string
  mood?: string
  quality?: string
  model?: string
  language?: string
  platform_params?: PromptPlatformParams
  quality_score?: PromptQualityScore
  tags?: string[]
  created_at: string
  updated_at?: string
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

// ==================== Prompt Studio 新增类型 ====================

/** 视频反推分析结果 */
export interface VideoAnalysisResult {
  subject: string
  shotTypes: string[]
  cameraMovements: string[]
  pacing: string
  transitions: string[]
  visualStyle: string
  colorPalette: string[]
  mood: string
  prompts: Record<string, string>
  tags: string[]
}

/** 收藏夹 */
export interface Favorite {
  id: string
  user_id?: string
  prompt: string
  negative_prompt?: string
  platform: string
  style?: string
  category: string
  tags: string[]
  note?: string
  created_at: string
}

/** 实验室 — 多风格变体 */
export interface LabVariant {
  style: string
  label: string
  prompt: string
  platform: string
}

export interface LabResult {
  subject: string
  variants: LabVariant[]
}

/** 行业模式 */
export type IndustryType =
  | 'portrait' | 'ecommerce' | 'fashion' | 'poster'
  | 'ip-character' | 'game-character' | 'architecture' | 'interior'
  | 'short-video' | 'ai-film'

/** 标签库类别 */
export interface TagCategory {
  name: string
  label: string
  icon: string
  tags: string[]
}

/** 爆款 Prompt */
export interface HotPrompt {
  id: string
  title: string
  platform: string
  prompt: string
  category: string
  likes: number
  style?: string
  tags: string[]
}

/** 优化结果 */
export interface OptimizeResult {
  original_prompt: string
  optimized_prompt: string
  quality_score: PromptQualityScore
  improvement: {
    originalScore: number
    optimizedScore: number
    improvement: number
  }
  diff?: string[]
}

// ==================== 模板驱动模式 ====================

/** Prompt 模板 */
export interface PromptTemplate {
  id: string
  name: string
  platform: 'midjourney' | 'flux' | 'stable-diffusion' | 'jimeng' | 'keling' | 'dalle' | 'leonardo' | 'comfyui' | 'fooocus'
  style: string
  category: string
  template: string
  description?: string
  aspectRatio?: string
  useCount?: number
  created_at: string
  updated_at?: string
}

/** 模板分类 */
export interface TemplateCategory {
  id: string
  name: string
  label: string
  count: number
}
