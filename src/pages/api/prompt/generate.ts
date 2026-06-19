// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletion, chatCompletionJson, isLlmConfigured } from '@/lib/llm'
import {
  validateBody,
  withErrorHandler,
  errorResponse,
  successResponse,
} from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { promptGenerateSchema } from '@/lib/schemas'
import type { PromptQualityScore, PromptPlatformParams } from '@/types'

const supabase = createAdminClient()

// ==================== 常量定义 ====================

const platformInstructions: Record<string, string> = {
  midjourney: 'Midjourney prompt. Use English, can include --ar, --v, --style raw, --stylize. Image descriptions should be specific, artistic, and visually rich.',
  'stable-diffusion': 'Stable Diffusion prompt. Use English comma-separated tags. Include quality boosters: masterpiece, best quality, highly detailed. Also output Negative Prompt, CFG, Steps, Sampler if applicable.',
  dalle: 'DALL·E 3 prompt. Use English complete sentences. DALL·E 3 understands natural language well.',
  leonardo: 'Leonardo AI prompt. Use English. Include style, lighting, renderer specs.',
  flux: 'Flux prompt. Use English. Natural language long prompt emphasizing detail, lighting, composition, mood.',
  jimeng: '即梦 AI 提示词。输出中文提示词，描述画面主体、风格、光线、氛围、构图。',
  keling: '可灵 AI 提示词。适合视频生成，描述动态画面、镜头运动、主体动作、光影变化。',
  comfyui: 'ComfyUI compatible prompt. Use English comma-separated tags. Include quality keywords, sampler hints, resolution details.',
  fooocus: 'Fooocus prompt. Use English. Focus on subject, lighting, style, composition. Include quality terms: 4k, detailed, sharp focus.',
}

const platformInstructionsCn: Record<string, string> = {
  midjourney: 'Midjourney 提示词。使用英文，可包含 --ar、--v、--style raw、--stylize 等参数。画面描述要具体、富有艺术感。',
  'stable-diffusion': 'Stable Diffusion 提示词。英文，使用逗号分隔的标签式描述，包含质量词如 masterpiece, best quality, highly detailed。同时输出 Negative Prompt、CFG、Steps、Sampler。',
  dalle: 'DALL·E 3 提示词。使用英文完整句子描述画面，DALL·E 3 对自然语言理解较好。',
  leonardo: 'Leonardo AI 提示词。英文，可包含风格、光影、渲染器说明。',
  flux: 'Flux 提示词。英文，输出自然语言长提示词，强调细节、光线、构图和氛围。',
  jimeng: '即梦 AI 提示词。输出中文提示词，描述画面主体、风格、光线、氛围、构图。',
  keling: '可灵 AI 提示词。适合视频生成，描述动态画面、镜头运动、主体动作、光影变化。',
  comfyui: 'ComfyUI 兼容提示词。使用英文逗号分隔标签，包含质量关键词、采样器提示和分辨率细节。',
  fooocus: 'Fooocus 提示词。使用英文，聚焦主体、光线、风格和构图，包含质量词如 4k, detailed, sharp focus。',
}

const styleKeywords: Record<string, string> = {
  cinematic: 'cinematic lighting, film grain, dramatic composition, epic scale, anamorphic lens, depth of field',
  anime: 'anime style, vibrant colors, cel shading, studio ghibli inspired, clean line art, 2D animation',
  realistic: 'photorealistic, hyper realistic, 8k uhd, sharp focus, detailed texture, subsurface scattering',
  minimal: 'minimalist, clean background, simple composition, negative space, elegant, zen aesthetic',
  cyberpunk: 'cyberpunk, neon lights, futuristic city, dark atmosphere, rain-slicked streets, holographic displays',
  vintage: 'vintage style, retro, film photography, warm tones, nostalgic, grainy texture, kodak portra',
  fantasy: 'fantasy art, magical atmosphere, ethereal lighting, mystical, enchanted realm, floating particles',
  noir: 'film noir, high contrast, dramatic shadows, monochrome, moody atmosphere, venetian blinds',
  watercolor: 'watercolor painting, soft edges, flowing colors, delicate wash, artistic, wet-on-wet technique',
  'oil-painting': 'oil painting, thick brushstrokes, rich textures, impasto technique, gallery quality, renaissance style',
  '3d-render': '3D render, octane render, unreal engine 5, photorealistic CGI, ray tracing, global illumination',
  'pixel-art': 'pixel art, 16-bit style, retro gaming aesthetic, sprite art, vibrant pixels, dithering',
  comic: 'comic book style, bold outlines, halftone dots, pop art, dynamic panels, ben day process',
  sketch: 'pencil sketch, charcoal drawing, hand-drawn, rough lines, artistic scribble, cross-hatching',
  surreal: 'surreal art, dreamlike, Salvador Dali style, melting forms, impossible geometry, metaphysical',
  gothic: 'gothic style, dark romantic, Victorian aesthetic, ornate details, haunting beauty, cathedral',
}

const cameraKeywords: Record<string, string> = {
  'close-up': 'close-up shot, shallow depth of field, bokeh background, macro detail, facial features',
  'portrait': 'portrait shot, waist-up, medium shot, 85mm lens, f/1.4, soft bokeh',
  'full-body': 'full body shot, standing pose, fashion photography, head-to-toe composition',
  'wide-angle': 'wide angle shot, 24mm lens, expansive view, deep depth of field, environmental',
  'bird-view': 'bird\'s eye view, top-down perspective, aerial perspective, drone shot from above',
  'pov': 'first person POV, point of view, immersive perspective, subjective camera',
  'aerial': 'aerial shot, drone photography, high altitude, sweeping landscape, cinematic drone',
}

const lightingKeywords: Record<string, string> = {
  'cinematic': 'cinematic lighting, three-point lighting, dramatic shadows, rim light, golden hour',
  'backlight': 'backlighting, rim lighting, silhouette effect, contre-jour, hair light',
  'soft': 'soft lighting, diffused light, overcast, gentle shadows, butterfly lighting',
  'volumetric': 'volumetric lighting, god rays, crepuscular rays, atmospheric light, fog illumination',
  'neon': 'neon lighting, cyberpunk glow, fluorescent, colored lights, night club aesthetic',
  'moonlight': 'moonlight, night scene, cool blue tones, ethereal glow, starry night',
}

const moodKeywords: Record<string, string> = {
  'dreamy': 'dreamy atmosphere, ethereal, soft focus, floating, magical realism, wonder',
  'mysterious': 'mysterious atmosphere, enigmatic, fog, shadows, hidden secrets, intrigue',
  'oppressive': 'oppressive atmosphere, dark, heavy, claustrophobic, dystopian, tension',
  'warm': 'warm atmosphere, cozy, golden light, nostalgic, comforting, intimate',
  'lonely': 'lonely atmosphere, solitude, empty space, melancholic, quiet, contemplative',
  'epic': 'epic atmosphere, grandiose, heroic, dramatic sky, monumental scale, sublime',
}

const qualityLevels: Record<string, { keywords: string; label: string }> = {
  'standard': { keywords: '', label: '普通' },
  'high': { keywords: 'masterpiece, best quality, highly detailed', label: '高级' },
  'master': { keywords: 'masterpiece, best quality, ultra detailed, 8k, highly detailed, award-winning, professional photography', label: '大师级' },
}

// ==================== 平台专属参数生成 ====================

function getPlatformParams(platform: string, aspectRatio?: string): PromptPlatformParams {
  switch (platform) {
    case 'midjourney':
      return {
        midjourney: {
          ar: aspectRatio || '16:9',
          stylize: 250,
          version: '6.0',
        },
      }
    case 'stable-diffusion':
      return {
        sdxl: {
          cfg: 7,
          steps: 30,
          sampler: 'DPM++ 2M Karras',
        },
      }
    default:
      return {}
  }
}

function formatPlatformSuffix(platform: string, aspectRatio?: string): string {
  switch (platform) {
    case 'midjourney':
      return aspectRatio ? ` --ar ${aspectRatio} --stylize 250 --v 6.0` : ' --ar 16:9 --stylize 250 --v 6.0'
    case 'stable-diffusion': {
      const ar = aspectRatio || '16:9'
      const [w, h] = ar.split(':')
      const scale = 768 / Math.max(Number(w), Number(h))
      const width = Math.round(Number(w) * scale)
      const height = Math.round(Number(h) * scale)
      return `\nNegative prompt: (worst quality, low quality, normal quality:1.4), (blurry:1.2), (deformed:1.2), (disfigured:1.2), bad anatomy, watermark, text, extra limbs\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: -1, Size: ${width}x${height}`
    }
    default:
      return ''
  }
}

// ==================== 质量评分 ====================

function scorePrompt(prompt: string, platform: string, style: string): PromptQualityScore {
  const length = prompt.length
  const words = prompt.split(/[\s,]+/).filter(Boolean).length

  // 细节丰富度
  const detailKeywords = ['detail', 'texture', 'lighting', 'shadow', 'color', 'background', 'environment', 'atmosphere']
  const detailCount = detailKeywords.filter(k => prompt.toLowerCase().includes(k)).length
  let detailScore = Math.min(100, detailCount * 12 + 20)
  if (words > 40) detailScore = Math.min(100, detailScore + 20)
  if (words > 80) detailScore = Math.min(100, detailScore + 10)

  // 构图完整度
  const compKeywords = ['composition', 'angle', 'shot', 'perspective', 'framing', 'depth of field', 'portrait', 'close-up', 'wide', 'full body']
  const compCount = compKeywords.filter(k => prompt.toLowerCase().includes(k)).length
  let compScore = Math.min(100, compCount * 15 + 15)

  // 风格准确度
  let styleScore = 75
  if (styleKeywords[style]) {
    const styleTerms = styleKeywords[style].split(', ').slice(0, 4)
    const styleMatch = styleTerms.filter(t => prompt.toLowerCase().includes(t.toLowerCase())).length
    styleScore = Math.min(100, styleMatch * 20 + 20)
  }

  // 平台适配度
  let platformScore = 75
  if (platform === 'midjourney' && prompt.includes('--ar')) platformScore = 95
  if (platform === 'stable-diffusion' && prompt.toLowerCase().includes('negative prompt')) platformScore = 95
  if (platform === 'flux' && words > 60) platformScore = 90

  const total = Math.round((detailScore + compScore + styleScore + platformScore) / 4)

  const suggestions: string[] = []
  if (detailScore < 70) suggestions.push('建议增加材质、纹理、光照等细节描述')
  if (compScore < 60) suggestions.push('建议添加镜头类型、构图方式等描述')
  if (styleScore < 70) suggestions.push('建议强化风格关键词，使风格更加鲜明')
  if (platformScore < 70) suggestions.push('建议根据平台特性添加专属参数')
  if (words < 30) suggestions.push('提示词偏短，建议扩展到 50 词以上以获得更好效果')
  if (total >= 85) suggestions.push('提示词质量优秀，可直接使用！')

  return { total, detail: detailScore, composition: compScore, style: styleScore, platform: platformScore, suggestions }
}

// ==================== 提取标签 ====================

function extractTags(prompt: string, platform: string, style: string, camera?: string, lighting?: string, mood?: string, quality?: string): string[] {
  const tags: string[] = []

  if (camera) {
    const labels: Record<string, string> = { 'close-up': '特写', 'portrait': '半身', 'full-body': '全身', 'wide-angle': '广角', 'bird-view': '鸟瞰', 'pov': '第一人称', 'aerial': '航拍' }
    tags.push(labels[camera] || camera)
  }
  if (lighting) {
    const labels: Record<string, string> = { 'cinematic': '电影光', 'backlight': '逆光', 'soft': '柔光', 'volumetric': '体积光', 'neon': '霓虹光', 'moonlight': '月光' }
    tags.push(labels[lighting] || lighting)
  }
  if (mood) {
    const labels: Record<string, string> = { 'dreamy': '梦幻', 'mysterious': '神秘', 'oppressive': '压抑', 'warm': '温馨', 'lonely': '孤独', 'epic': '史诗感' }
    tags.push(labels[mood] || mood)
  }
  if (quality) {
    const labels: Record<string, string> = { 'standard': '普通', 'high': '高级', 'master': '大师级' }
    tags.push(labels[quality] || quality)
  }

  if (platform === 'midjourney') tags.push('Midjourney')
  if (platform === 'stable-diffusion') tags.push('SDXL')
  if (platform === 'flux') tags.push('Flux')

  if (prompt.includes('8k')) tags.push('8K')
  if (prompt.includes('masterpiece')) tags.push('masterpiece')
  if (prompt.includes('photorealistic') || prompt.includes('hyper realistic')) tags.push('写实')

  return tags
}

// ==================== 构建提示词 ====================

function buildPrompt(
  platform: string,
  subject: string,
  style: string,
  language: string,
  details?: string,
  negativePrompt?: string,
  aspectRatio?: string,
  camera?: string,
  lighting?: string,
  mood?: string,
  quality?: string
): string {
  const isEnglish = language === 'en'
  const platformGuide = isEnglish
    ? platformInstructions[platform] || platformInstructions.midjourney
    : platformInstructionsCn[platform] || platformInstructionsCn.midjourney
  const styleGuide = styleKeywords[style] || styleKeywords.cinematic

  // 构建额外参数
  const extraParts: string[] = []
  if (camera) extraParts.push(`Camera: ${cameraKeywords[camera]}`)
  if (lighting) extraParts.push(`Lighting: ${lightingKeywords[lighting]}`)
  if (mood) extraParts.push(`Mood: ${moodKeywords[mood]}`)
  if (quality) extraParts.push(`Quality: ${qualityLevels[quality].keywords}`)
  const extraStr = extraParts.length > 0 ? extraParts.join('\n') : ''

  if (isEnglish) {
    const suffix = formatPlatformSuffix(platform, aspectRatio)
    const neg = negativePrompt ? `Negative: ${negativePrompt}` : ''

    return `Generate an AI image prompt for ${platform}.

【Core Subject】${subject}
【Details】${details || 'None'}
【Style】${style} (${styleGuide})
【Aspect Ratio】${aspectRatio || '16:9'}
${extraStr}

Requirements:
1. The prompt MUST revolve tightly around "${subject}" — absolutely no deviation.
2. Must include: subject description, action/pose, environment/setting, lighting, color palette, composition, artistic style, quality boosters.
3. The prompt must be at least 80 words, specific, vivid, and directly usable in ${platform} without modification.
4. Output ONLY the final English prompt. No explanations, no markdown, no JSON, no code blocks.
${suffix ? `5. Append "${suffix}" at the end.` : ''}
${neg ? `6. ${neg}` : ''}

Platform guidelines: ${platformGuide}

Now generate:`
  }

  const suffix = formatPlatformSuffix(platform, aspectRatio)
  const neg = negativePrompt ? `反向提示词：${negativePrompt}` : ''

  return `为 ${platform} 生成英文 AI 绘图提示词。

【核心主题】${subject}
【细节】${details || '无'}
【风格】${style} (${styleGuide})
【画面比例】${aspectRatio || '16:9'}
${extraStr}

要求：
1. 提示词必须紧紧围绕 "${subject}" 这个主体展开，绝对禁止偏离主题。
2. 必须包含：主体描述、动作/姿态、环境/场景、光线、色彩、构图、艺术风格、画质词。
3. 提示词必须达到 120 个字符以上，内容具体、生动、细节丰富，可直接在 ${platform} 中使用。
4. 直接输出最终英文提示词，不要解释、不要 markdown、不要 JSON、不要代码块。
${suffix ? `5. 在末尾加入 "${suffix}"。` : ''}
${neg ? `6. ${neg}` : ''}

平台说明：${platformGuide}

请生成提示词：`
}

// ==================== 处理器 ====================

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
    camera,
    lighting,
    mood,
    quality,
  } = validateBody(req, promptGenerateSchema)

  const promptText = buildPrompt(
    platform, subject, style, language, details, negativePrompt, aspectRatio,
    camera, lighting, mood, quality
  )

  let generatedPrompt: string
  let negativePromptFull: string | undefined

  if (!isLlmConfigured()) {
    // Fallback
    const qualityStr = quality ? qualityLevels[quality].keywords + ', ' : ''
    const cameraStr = camera ? cameraKeywords[camera] + ', ' : ''
    const lightingStr = lighting ? lightingKeywords[lighting] + ', ' : ''
    const moodStr = mood ? moodKeywords[mood] + ', ' : ''
    generatedPrompt = `${subject}, ${cameraStr}${lightingStr}${moodStr}${qualityStr}${styleKeywords[style] || styleKeywords.cinematic}, masterpiece, best quality, highly detailed, ${details || ''}${formatPlatformSuffix(platform, aspectRatio)}`
    if (platform === 'stable-diffusion' && negativePrompt) {
      negativePromptFull = `(worst quality, low quality:1.4), (blurry:1.2), ${negativePrompt}`
    }
  } else {
    const isEnglish = language === 'en'

    const systemPrompt = isEnglish
      ? 'You are a professional AI image prompt engineer. Generate a detailed, vivid, specific English prompt tightly focused on the user\'s core subject. Output only the final prompt — no explanations, no markdown, no extra text. The prompt must be at least 80 words, directly usable in the target platform. Include all specified camera, lighting, mood, and quality parameters naturally in the prompt.'
      : '你是一位专业的 AI 绘图提示词工程师。围绕用户给定的【核心主题】，生成一条细节丰富、不偏离主题的英文提示词。将镜头、光线、情绪、画质参数自然地融入提示词中。提示词必须达到 120 个字符以上。只输出最终提示词，不添加解释、markdown 或额外文字。'

    generatedPrompt = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText },
      ],
      { temperature: 0.5, maxTokens: 2048, model: model || undefined, language: language || undefined }
    )

    generatedPrompt = generatedPrompt.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  }

  // 平台专属参数
  const platformParams = getPlatformParams(platform, aspectRatio)

  // 质量评分
  const qualityScore = scorePrompt(generatedPrompt, platform, style)

  // 提取标签
  const tags = extractTags(generatedPrompt, platform, style, camera, lighting, mood, quality)

  const result = {
    id: crypto.randomUUID(),
    platform,
    subject,
    style,
    details: details || null,
    negative_prompt: negativePrompt || null,
    generated_prompt: generatedPrompt,
    negative_prompt_full: negativePromptFull || null,
    aspect_ratio: aspectRatio,
    camera: camera || null,
    lighting: lighting || null,
    mood: mood || null,
    quality: quality || null,
    model: model || null,
    language: language || 'cn',
    platform_params: platformParams,
    quality_score: qualityScore,
    tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

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
          metadata: { prompt_id: data.id, platform, style, aspect_ratio: aspectRatio, model, language, camera, lighting, mood, quality },
        })
        return successResponse(res, data)
      }
    } catch {
      console.warn('Supabase unavailable, returning in-memory result')
    }
  }

  return successResponse(res, result)
}

export default withErrorHandler(handler)