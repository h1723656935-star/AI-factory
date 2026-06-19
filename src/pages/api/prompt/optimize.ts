// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { promptOptimizeEnhancedSchema } from '@/lib/schemas'
import { scorePrompt } from '@/pages/api/prompt/generate'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }
  if (!applyRateLimit(req, res, 'ai')) return

  const { prompt, platform, level, style, model, language } = validateBody(req, promptOptimizeEnhancedSchema)

  const levelConfig: Record<string, { desc: string; additions: string[] }> = {
    basic: {
      desc: 'Basic optimization: add camera angle and basic lighting',
      additions: ['Add camera angle/shot type', 'Add basic lighting description'],
    },
    pro: {
      desc: 'Professional optimization: add camera, lighting, materials, composition',
      additions: [
        'Add camera specs (lens, aperture, shot type)',
        'Add detailed lighting system (source, direction, quality, shadows)',
        'Add material textures and surface qualities',
        'Add composition/framing details',
      ],
    },
    master: {
      desc: 'Master optimization: full photography-grade enhancement',
      additions: [
        'Add camera specs (lens, aperture, focal length, shot type)',
        'Add detailed lighting system (source, direction, quality, shadows, rim light)',
        'Add rich material textures (fabric, metal, skin, environment)',
        'Add composition and framing (rule of thirds, leading lines, depth)',
        'Add color palette and mood description',
        'Add atmosphere and environmental details',
      ],
    },
  }
  const config = levelConfig[level] || levelConfig.pro

  const isEnglish = language === 'en'
  const systemPrompt = isEnglish
    ? 'You are a world-class AI prompt optimizer. Enhance the given prompt with photography-grade details. Output ONLY the optimized prompt text, no explanations, no markdown.'
    : '你是一位世界级 AI 提示词优化师。为给定提示词增加摄影级细节。只输出优化后的提示词，不要解释。'

  const userPrompt = isEnglish
    ? `${config.desc}\n\n${config.additions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nOriginal prompt: "${prompt}"\n\nOutput ONLY the optimized prompt.`
    : `优化等级：${level === 'master' ? '大师级' : level === 'pro' ? '专业级' : '基础级'}\n\n${config.additions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n原提示词："${prompt}"\n\n只输出优化后的提示词。`

  let optimized = prompt
  if (isLlmConfigured()) {
    try {
      optimized = await chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.3, maxTokens: 3072, model: model || undefined, language: language || undefined }
      )
      optimized = optimized.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
    } catch {
      // Fallback: use original prompt
    }
  }

  const originalScore = scorePrompt(prompt, platform, style || 'cinematic')
  const optimizedScore = scorePrompt(optimized, platform, style || 'cinematic')
  const improvement = optimizedScore.total - originalScore.total

  const diff: string[] = []
  if (optimizedScore.detail > originalScore.detail) diff.push(`细节丰富度 +${optimizedScore.detail - originalScore.detail}`)
  if (optimizedScore.composition > originalScore.composition) diff.push(`构图完整度 +${optimizedScore.composition - originalScore.composition}`)
  if (optimizedScore.style > originalScore.style) diff.push(`风格准确度 +${optimizedScore.style - originalScore.style}`)
  if (optimizedScore.platform > originalScore.platform) diff.push(`平台适配度 +${optimizedScore.platform - originalScore.platform}`)

  return successResponse(res, {
    original_prompt: prompt,
    optimized_prompt: optimized,
    quality_score: optimizedScore,
    improvement: {
      originalScore: originalScore.total,
      optimizedScore: optimizedScore.total,
      improvement,
    },
    diff,
  })
}

export default withErrorHandler(handler)