// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletion, isLlmConfigured, getAvailableModels } from '@/lib/llm'
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
  midjourney:
    'Midjourney prompt. Use English, can include parameters like --ar, --v, --style raw. Image descriptions should be specific and highly artistic.',
  'stable-diffusion':
    'Stable Diffusion prompt. Use English with comma-separated tag-style descriptions. Include quality boosters like masterpiece, best quality, highly detailed.',
  dalle:
    'DALL·E 3 prompt. Use English complete sentences to describe the image. DALL·E 3 understands natural language well.',
  leonardo:
    'Leonardo AI prompt. Use English. Can include style, lighting, and renderer specifications.',
  flux:
    'Flux prompt. Use English. Clear descriptions emphasizing detail, lighting, composition, and mood.',
  jimeng:
    '即梦 AI 提示词。中英文均可，描述画面主体、风格、光线、氛围、构图。',
  keling:
    '可灵 AI 提示词。适合视频生成，描述动态画面、镜头运动、主体动作、光影变化。',
  comfyui:
    'ComfyUI compatible prompt. Use English comma-separated tags. Include quality keywords, sampler hints, and resolution details.',
  fooocus:
    'Fooocus prompt. Use English. Focus on subject, lighting, style, and composition. Include quality terms like 4k, detailed, sharp focus.',
}

const platformInstructionsCn: Record<string, string> = {
  midjourney:
    'Midjourney 提示词。使用英文，可包含 --ar、--v、--style raw 等参数。画面描述要具体、富有艺术感。',
  'stable-diffusion':
    'Stable Diffusion 提示词。英文，使用逗号分隔的标签式描述，包含质量词如 masterpiece, best quality, highly detailed。',
  dalle:
    'DALL·E 3 提示词。使用英文完整句子描述画面，DALL·E 3 对自然语言理解较好。',
  leonardo:
    'Leonardo AI 提示词。英文，可包含风格、光影、渲染器说明。',
  flux:
    'Flux 提示词。英文，描述清晰，强调细节、光线、构图和氛围。',
  jimeng:
    '即梦 AI 提示词。中英文均可，描述画面主体、风格、光线、氛围、构图。',
  keling:
    '可灵 AI 提示词。适合视频生成，描述动态画面、镜头运动、主体动作、光影变化。',
  comfyui:
    'ComfyUI 兼容提示词。使用英文逗号分隔标签，包含质量关键词、采样器提示和分辨率细节。',
  fooocus:
    'Fooocus 提示词。使用英文，聚焦主体、光线、风格和构图，包含质量词如 4k, detailed, sharp focus。',
}

const styleKeywords: Record<string, string> = {
  cinematic: 'cinematic lighting, film grain, dramatic composition, epic scale, anamorphic lens',
  anime: 'anime style, vibrant colors, cel shading, studio ghibli inspired, clean line art',
  realistic: 'photorealistic, hyper realistic, 8k uhd, sharp focus, detailed texture',
  minimal: 'minimalist, clean background, simple composition, negative space, elegant',
  cyberpunk: 'cyberpunk, neon lights, futuristic city, dark atmosphere, rain-slicked streets',
  vintage: 'vintage style, retro, film photography, warm tones, nostalgic, grainy texture',
  fantasy: 'fantasy art, magical atmosphere, ethereal lighting, mystical, enchanted realm',
  noir: 'film noir, high contrast, dramatic shadows, monochrome, moody atmosphere',
  watercolor: 'watercolor painting, soft edges, flowing colors, delicate wash, artistic',
  'oil-painting': 'oil painting, thick brushstrokes, rich textures, impasto technique, gallery quality',
  '3d-render': '3D render, octane render, unreal engine 5, photorealistic CGI, ray tracing',
  'pixel-art': 'pixel art, 16-bit style, retro gaming aesthetic, sprite art, vibrant pixels',
  comic: 'comic book style, bold outlines, halftone dots, pop art, dynamic panels',
  sketch: 'pencil sketch, charcoal drawing, hand-drawn, rough lines, artistic scribble',
  surreal: 'surreal art, dreamlike, Salvador Dali style, melting forms, impossible geometry',
  gothic: 'gothic style, dark romantic, Victorian aesthetic, ornate details, haunting beauty',
}

function buildPrompt(
  platform: string,
  subject: string,
  style: string,
  language: string,
  details?: string,
  negativePrompt?: string,
  aspectRatio?: string
): string {
  const isEnglish = language === 'en'
  const platformGuide = isEnglish
    ? platformInstructions[platform] || platformInstructions.midjourney
    : platformInstructionsCn[platform] || platformInstructionsCn.midjourney
  const styleGuide = styleKeywords[style] || styleKeywords.cinematic

  if (isEnglish) {
    const aspect = aspectRatio ? `--ar ${aspectRatio}` : ''
    const neg = negativePrompt ? `Negative prompt: ${negativePrompt}` : ''

    return `Generate an AI image prompt for ${platform}.

【Core Subject】${subject}
【Details】${details || 'None'}
【Style】${style} (${styleGuide})
【Aspect Ratio】${aspectRatio || '9:16'}

Requirements:
1. The prompt MUST revolve tightly around "${subject}" — absolutely no deviation from the core subject.
2. Must include: subject description, action or pose, environment or setting, lighting, color palette, composition, artistic style, and quality boosters.
3. The prompt must be at least 80 words, specific, vivid, and directly usable in ${platform} without any modification.
4. Output ONLY the final English prompt. No explanations, no markdown, no JSON, no code blocks.
5. Append ${aspect || '--ar 9:16'} at the end of the prompt.
${neg ? `6. ${neg}` : ''}

Platform guidelines: ${platformGuide}

Now generate the prompt:`
  }

  // Chinese prompt
  const aspect = aspectRatio ? `--ar ${aspectRatio}` : ''
  const neg = negativePrompt ? `反向提示词：${negativePrompt}` : ''

  return `为 ${platform} 生成英文 AI 绘图提示词。

【核心主题】${subject}
【细节】${details || '无'}
【风格】${style} (${styleGuide})
【画面比例】${aspectRatio || '9:16'}

要求：
1. 提示词必须紧紧围绕 "${subject}" 这个主体展开，绝对禁止偏离主题。
2. 必须包含以下要素：主体描述、动作或姿态、环境或场景、光线、色彩、构图、艺术风格、画质词。
3. 提示词必须达到 120 个字符以上，内容具体、生动、细节丰富，可直接在 ${platform} 中使用，无需任何修改。
4. 直接输出最终英文提示词，不要解释、不要 markdown、不要 JSON、不要代码块。
5. 在末尾加入 ${aspect || '--ar 9:16'}。
${neg ? `6. ${neg}` : ''}

平台说明：${platformGuide}

请生成提示词：`
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const {
    platform,
    subject,
    style,
    details,
    negativePrompt,
    aspectRatio,
    model,
    language,
  } = validateBody(req, promptGenerateSchema)

  const promptText = buildPrompt(
    platform,
    subject,
    style,
    language,
    details,
    negativePrompt,
    aspectRatio
  )

  let generatedPrompt: string

  if (!isLlmConfigured()) {
    // Fallback: rule-based prompt when LLM is not configured
    generatedPrompt = `${subject}, ${styleKeywords[style] || styleKeywords.cinematic}, masterpiece, best quality, highly detailed, ${details || ''} --ar ${aspectRatio || '9:16'}`
  } else {
    const isEnglish = language === 'en'

    const systemPrompt = isEnglish
      ? 'You are a professional AI image prompt engineer. Your task is to generate a detailed, vivid, and specific English prompt tightly focused on the user\'s core subject. Output only the final prompt — no explanations, no markdown code blocks, no extra text. The prompt must be at least 80 words, directly usable in the target platform.'
      : '你是一位专业的 AI 绘图提示词工程师。你的任务是围绕用户给定的【核心主题】，生成一条细节丰富、不偏离主题的英文提示词。提示词必须达到 120 个字符以上，具体、生动，可直接在目标平台中使用。只输出最终提示词，不添加解释、markdown 代码块或额外文字。'

    generatedPrompt = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText },
      ],
      { temperature: 0.5, maxTokens: 2048, model: model || undefined, language: language || undefined }
    )

    // Clean up possible markdown code blocks
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
    model: model || null,
    language: language || 'cn',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Try to write to database
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
          metadata: { prompt_id: data.id, platform, style, aspect_ratio: aspectRatio, model, language },
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