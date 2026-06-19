import { z } from 'zod'

// 视频分析请求
export const videoAnalysisSchema = z.object({
  url: z.string().url('请输入有效的视频链接'),
  platform: z.enum(['douyin', 'kuaishou', 'xiaohongshu', 'bilibili', 'youtube', 'unknown']).default('unknown'),
  model: z.string().optional(),
  language: z.enum(['cn', 'en']).default('cn'),
})

// 脚本生成请求
export const scriptGenerateSchema = z.object({
  analysisId: z.string().uuid('请输入有效的分析ID').optional(),
  topic: z.string().min(2, '主题至少2个字符').max(300, '主题不能超过300字符'),
  style: z.enum([
    'funny', 'emotional', 'knowledge', 'suspense', 'inspirational', 'review',
    'vlog', 'tutorial', 'storytelling', 'debate', 'challenge', 'asmr',
    'interview', 'prank', 'transformation', 'food', 'tech', 'fashion',
    'travel', 'fitness', 'parenting', 'finance',
  ]).default('funny'),
  tone: z.string().max(50).optional(),
  length: z.enum(['ultra-short', 'short', 'medium', 'long', 'ultra-long']).default('medium'),
  model: z.string().optional(),
  language: z.enum(['cn', 'en']).default('cn'),
})

// 分镜生成请求
export const storyboardGenerateSchema = z.object({
  scriptId: z.string().uuid('请输入有效的脚本ID').optional(),
  scriptContent: z.string().min(10, '脚本内容至少10个字符').optional(),
  style: z.enum([
    'cinematic', 'anime', 'realistic', 'minimal', 'vintage', 'cyberpunk',
    'fantasy', 'noir', 'watercolor', 'oil-painting', '3d-render',
    'pixel-art', 'comic', 'sketch', 'surreal', 'gothic',
  ]).default('cinematic'),
  frameCount: z.number().int().min(3).max(24).default(6),
  model: z.string().optional(),
  language: z.enum(['cn', 'en']).default('cn'),
})

// 提示词生成请求
export const promptGenerateSchema = z.object({
  platform: z.enum([
    'midjourney', 'stable-diffusion', 'dalle', 'leonardo', 'flux',
    'jimeng', 'keling', 'comfyui', 'fooocus',
  ]).default('midjourney'),
  subject: z.string().min(2, '主体描述至少2个字符').max(500, '主体描述不能超过500字符'),
  style: z.enum([
    'cinematic', 'anime', 'realistic', 'minimal', 'cyberpunk', 'vintage',
    'fantasy', 'noir', 'watercolor', 'oil-painting', '3d-render',
    'pixel-art', 'comic', 'sketch', 'surreal', 'gothic',
  ]).default('cinematic'),
  details: z.string().max(1000).optional(),
  negativePrompt: z.string().max(500).optional(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:2', '2:3']).default('9:16'),
  model: z.string().optional(),
  language: z.enum(['cn', 'en']).default('cn'),
})

// 订阅创建请求
export const subscriptionCreateSchema = z.object({
  planId: z.string().min(1, '请选择订阅方案'),
  paymentMethod: z.string().optional(),
})

// 提示词模板
export const promptTemplateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空').max(100),
  platform: z.string().default('midjourney'),
  prompt: z.string().min(5, '提示词至少5个字符'),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
  isPublic: z.boolean().default(false),
})