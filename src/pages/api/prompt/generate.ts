import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import {
  validateBody,
  withErrorHandler,
  errorResponse,
  successResponse,
} from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { promptGenerateSchema } from '@/lib/schemas'

const supabase = createAdminClient()

const platformInstructions: Record<string, string> = {
  midjourney: 'Midjourney 提示词。使用英文，可包含 --ar、--v、--style raw 等参数。画面描述要具体、富有艺术感。',
  'stable-diffusion': 'Stable Diffusion 提示词。英文，使用逗号分隔的标签式描述，包含质量词如 masterpiece, best quality, highly detailed。',
  dalle: 'DALL·E 3 提示词。使用英文完整句子描述画面，DALL·E 3 对自然语言理解较好。',
  leonardo: 'Leonardo AI 提示词。英文，可包含风格、光影、渲染器说明。',
  flux: 'Flux 提示词。英文，描述清晰，强调细节和构图。',
  jimeng: '即梦 AI 提示词。中英文均可，描述画面主体、风格、光线、氛围。',
  keling: '可灵 AI 提示词。适合视频生成，描述动态画面、镜头运动、主体动作。',
}

const styleKeywords: Record<string, string> = {
  cinematic: 'cinematic lighting, film grain, dramatic composition',
  anime: 'anime style, vibrant colors, cel shading',
  realistic: 'photorealistic, hyper realistic, 8k uhd',
  minimal: 'minimalist, clean background, simple composition',
  cyberpunk: 'cyberpunk, neon lights, futuristic city, dark atmosphere',
  vintage: 'vintage style, retro, film photography, warm tones',
}

function buildPrompt(
  platform: string,
  subject: string,
  style: string,
  details?: string,
  negativePrompt?: string,
  aspectRatio?: string
): string {
  const platformGuide = platformInstructions[platform] || platformInstructions.midjourney
  const styleGuide = styleKeywords[style] || styleKeywords.cinematic
  const aspect = aspectRatio ? `--ar ${aspectRatio}` : ''
  const neg = negativePrompt ? `Negative prompt: ${negativePrompt}` : ''

  return `为 ${platform} 生成英文 AI 绘图提示词。

【核心主题】${subject}
【细节】${details || '无'}
【风格】${style} (${styleGuide})
【画面比例】${aspectRatio || '9:16'}

要求：
1. 提示词必须紧紧围绕 "${subject}" 这个主体展开，绝对禁止偏离主题。
2. 必须包含：主体、动作/姿态、环境、光线、色彩、构图、艺术风格、画质词。
3. 直接输出最终英文提示词，不要解释、不要 markdown、不要 JSON。
4. 在末尾加入 ${aspect || '--ar 9:16'}。
${neg ? `5. ${neg}` : ''}

平台说明：${platformGuide}

请生成提示词：`
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { platform, subject, style, details, negativePrompt, aspectRatio } = validateBody(
    req,
    promptGenerateSchema
  )

  const promptText = buildPrompt(platform, subject, style, details, negativePrompt, aspectRatio)

  let generatedPrompt: string

  if (!isLlmConfigured()) {
    // 未配置 LLM 时使用规则化提示词
    generatedPrompt = `${subject}, ${styleKeywords[style] || styleKeywords.cinematic}, masterpiece, best quality, highly detailed, ${details || ''} --ar ${aspectRatio || '9:16'}`
  } else {
    generatedPrompt = await chatCompletion(
      [
        {
          role: 'system',
          content:
            '你是一位专业的 AI 绘图提示词工程师。你的任务是围绕用户给定的【核心主题】，生成一条细节丰富、不偏离主题的英文提示词。只输出最终提示词，不添加解释、markdown 代码块或额外文字。',
        },
        { role: 'user', content: promptText },
      ],
      { temperature: 0.5, maxTokens: 2048 }
    )

    // 清理可能的 markdown 代码块
    generatedPrompt = generatedPrompt.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  }

  const result = {
    id: crypto.randomUUID(),
    platform,
    subject,
    style,
    details: details || null,
    negative_prompt: negativePrompt || null,
    generated_prompt: generatedPrompt,
    aspect_ratio: aspectRatio,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // 尝试写入数据库
  if (supabase) {
    try {
      const { data } = await supabase
        .from('prompts')
        .insert(result)
        .select()
        .single()

      if (data) {
        await supabase.from('user_history').insert({
          action_type: 'prompt',
          title: `提示词生成：${subject.slice(0, 30)}...`,
          description: `为 ${platform} 生成 AI 绘图提示词`,
          metadata: { prompt_id: data.id, platform, style, aspect_ratio: aspectRatio },
        })
        return successResponse(res, data)
      }
    } catch {
      console.warn('Supabase 未配置，返回内存结果')
    }
  }

  return successResponse(res, result)
}

export default withErrorHandler(handler)
