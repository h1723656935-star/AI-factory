// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { labGenerateSchema } from '@/lib/schemas'
import { styleKeywords } from '@/pages/api/prompt/generate'

const defaultLabStyles = ['realistic', 'cinematic', 'anime', 'cyberpunk', 'fantasy', 'watercolor', '3d-render', 'sketch']

const styleLabels: Record<string, string> = {
  realistic: '写实版', cinematic: '电影版', anime: '漫剧版', cyberpunk: '赛博朋克版',
  fantasy: '奇幻版', watercolor: '水彩版', '3d-render': '3D渲染版', sketch: '素描版',
  'oil-painting': '油画版', noir: '暗黑版', vintage: '复古版', surreal: '超现实版',
  minimal: '极简版', 'pixel-art': '像素版', comic: '漫画版', gothic: '哥特版',
}

const industryStyles: Record<string, string[]> = {
  portrait: ['realistic', 'cinematic', 'vintage', 'noir', 'watercolor'],
  ecommerce: ['realistic', 'cinematic', 'minimal', '3d-render'],
  fashion: ['cinematic', 'realistic', 'surreal', 'noir'],
  poster: ['cinematic', 'comic', 'oil-painting', 'cyberpunk'],
  'ip-character': ['anime', '3d-render', 'comic', 'fantasy'],
  'game-character': ['cinematic', 'fantasy', 'cyberpunk', 'noir'],
  architecture: ['realistic', 'cinematic', 'minimal', 'watercolor'],
  interior: ['realistic', 'cinematic', 'minimal', '3d-render'],
  'short-video': ['cinematic', 'anime', 'realistic', 'cyberpunk'],
  'ai-film': ['cinematic', 'fantasy', 'cyberpunk', 'noir'],
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }
  if (!applyRateLimit(req, res, 'ai')) return

  const { subject, styles, industry, model, language } = validateBody(req, labGenerateSchema)

  // 确定风格列表
  let targetStyles = styles || defaultLabStyles
  if (industry && industryStyles[industry]) {
    targetStyles = industryStyles[industry]
  }

  const isEnglish = language === 'en'
  const systemPrompt = isEnglish
    ? 'You are a world-class prompt engineer. Generate multiple style variants of a prompt. Output ONLY valid JSON array.'
    : '你是一位世界级提示词工程师。为同一个主体生成多个风格变体。只输出JSON。'

  if (!isLlmConfigured()) {
    // Fallback: 使用风格关键词库
    const variants = targetStyles.map((s) => {
      const sw = styleKeywords[s] || styleKeywords.cinematic
      return {
        style: s,
        label: styleLabels[s] || s,
        prompt: `${subject}, ${sw}, masterpiece, best quality, highly detailed`,
        platform: 'midjourney',
      }
    })
    return successResponse(res, { subject, variants })
  }

  const userPrompt = isEnglish
    ? `Subject: "${subject}". Generate ${targetStyles.length} prompt variants, one for each style: ${targetStyles.join(', ')}. Each variant should be a complete, photography-grade prompt. Output JSON array: [{"style":"realistic","label":"Realistic","prompt":"...","platform":"midjourney"}]`
    : `主体："${subject}"。生成 ${targetStyles.length} 个风格变体：${targetStyles.join('、')}。每个变体是完整的摄影级提示词。输出JSON数组：[{"style":"realistic","label":"写实版","prompt":"...","platform":"midjourney"}]`

  try {
    const text = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 4096, responseFormat: 'json', model: model || undefined, language: language || undefined }
    )

    const cleaned = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    const variants = Array.isArray(parsed) ? parsed : parsed.variants || []

    return successResponse(res, {
      subject,
      variants: variants.map((v: any) => ({
        style: v.style || 'realistic',
        label: styleLabels[v.style] || v.label || v.style,
        prompt: v.prompt || '',
        platform: v.platform || 'midjourney',
      })),
    })
  } catch {
    return errorResponse(res, '实验室生成失败，请稍后重试', 500)
  }
}

export default withErrorHandler(handler)