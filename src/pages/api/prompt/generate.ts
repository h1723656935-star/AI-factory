// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { promptGenerateSchema, promptOptimizeSchema } from '@/lib/schemas'
import type { PromptQualityScore, PromptPlatformParams } from '@/types'
import {
  photographyLibrary, lightingLibrary, qualityLibrary,
  materialLibrary, colorLibrary, sceneLibrary,
  matchPhotography, matchLighting, matchQuality, matchColor,
  pickFromLibrary,
  detectSubjectType,
  generateSubjectContent,
  getSubjectTypeLabel,
  shuffleArray,
} from '@/lib/prompt-kb'
import {
  getRandomTemplate, getTemplatesByPlatformAndStyle,
  replacePlaceholders, recordTemplateUse, loadTemplates,
} from '@/lib/prompt-templates'

const supabase = createAdminClient()

// ==================== 风格关键词 ====================

export const styleKeywords: Record<string, string> = {
  cinematic: 'cinematic lighting, film grain, dramatic composition, epic scale, anamorphic lens, depth of field, 35mm film aesthetic',
  anime: 'anime style, vibrant colors, cel shading, clean line art, 2D animation, detailed background art',
  realistic: 'photorealistic, hyper realistic, 8k uhd, sharp focus, detailed texture, subsurface scattering, ray tracing',
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

// ==================== 平台专属参数 ====================

function getPlatformParams(platform: string, aspectRatio?: string): PromptPlatformParams {
  switch (platform) {
    case 'midjourney':
      return { midjourney: { ar: aspectRatio || '16:9', stylize: 250, version: '6.0' } }
    case 'stable-diffusion':
      return { sdxl: { cfg: 7, steps: 30, sampler: 'DPM++ 2M Karras' } }
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
      return `\nNegative prompt: (worst quality, low quality:1.4), (blurry:1.2), (deformed:1.2), bad anatomy, watermark, text\nSteps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: -1, Size: ${Math.round(Number(w) * scale)}x${Math.round(Number(h) * scale)}`
    }
    default:
      return ''
  }
}

// ==================== 真实质量评分引擎 ====================

export function scorePrompt(prompt: string, platform: string, style: string): PromptQualityScore {
  const lower = prompt.toLowerCase()
  const words = prompt.split(/[\s,]+/).filter(Boolean).length
  const charCount = prompt.length

  const checkTerms = (terms: string[], bonus: number = 1): number => {
    let count = 0
    for (const term of terms) {
      if (lower.includes(term)) count += bonus
    }
    return count
  }

  // 1. 细节丰富度 — 检测材质、光影、肤质、环境
  const materialTerms = ['texture', 'material', 'silk', 'leather', 'metal', 'wood', 'glass', 'fabric', 'skin texture', 'cloth', 'cotton', 'velvet', 'marble', 'gold', 'silver', 'crystal', 'jade', 'porcelain', 'bronze']
  const lightingTerms = ['lighting', 'light', 'shadow', 'illumination', 'glow', 'ray', 'sunlight', 'moonlight', 'neon', 'rim light', 'backlight', 'volumetric', 'god rays', 'golden hour', 'soft light', 'harsh light', 'ambient', 'reflection', 'bounce']
  const skinTerms = ['skin', 'subsurface', 'pore', 'complexion', 'flawless', 'smooth skin', 'realistic skin', 'skin detail']
  const envTerms = ['background', 'environment', 'scene', 'landscape', 'setting', 'surrounding', 'atmosphere', 'room', 'forest', 'city', 'mountain', 'ocean', 'garden', 'studio']

  const materialCount = checkTerms(materialTerms)
  const lightingCount = checkTerms(lightingTerms)
  const skinCount = checkTerms(skinTerms)
  const envCount = checkTerms(envTerms)

  let detailScore = 0
  detailScore += Math.min(35, materialCount * 7)
  detailScore += Math.min(30, lightingCount * 5)
  detailScore += Math.min(20, skinCount * 6)
  detailScore += Math.min(15, envCount * 4)
  if (words > 60) detailScore = Math.min(100, detailScore + 10)
  if (words > 100) detailScore = Math.min(100, detailScore + 10)
  if (words > 150) detailScore = Math.min(100, detailScore + 5)

  // 2. 构图完整度 — 检测镜头、焦段、景别、景深
  const lensTerms = ['lens', 'mm', 'f/', 'aperture', 'focal', '50mm', '85mm', '24mm', '35mm', '100mm', '70-200mm', 'telephoto', 'wide angle', 'macro', 'prime', 'zoom']
  const shotTerms = ['shot', 'close-up', 'portrait', 'full body', 'wide', 'aerial', 'bird', 'pov', 'angle', 'perspective', 'view', 'composition', 'framing', 'medium shot', 'long shot', 'extreme close-up']
  const dofTerms = ['depth of field', 'bokeh', 'shallow', 'focus', 'blur', 'background blur', 'sharp focus', 'dof', 'depth']

  const lensCount = checkTerms(lensTerms)
  const shotCount = checkTerms(shotTerms)
  const dofCount = checkTerms(dofTerms)

  let compScore = 0
  compScore += Math.min(35, lensCount * 8)
  compScore += Math.min(40, shotCount * 6)
  compScore += Math.min(25, dofCount * 7)
  if (shotCount >= 2 && lensCount >= 1) compScore = Math.min(100, compScore + 10)
  if (shotCount >= 3 && lensCount >= 2) compScore = Math.min(100, compScore + 10)

  // 3. 风格准确度 — 检测风格关键词匹配
  let styleScore = 35
  if (styleKeywords[style]) {
    const styleTerms = styleKeywords[style].split(', ').map(s => s.trim().toLowerCase())
    const matched = styleTerms.filter(t => lower.includes(t))
    const matchRate = matched.length / Math.min(styleTerms.length, 8)
    styleScore = Math.min(100, Math.round(matchRate * 90) + 10)
    if (matched.length >= 4) styleScore = Math.min(100, styleScore + 10)
    if (matched.length >= 6) styleScore = Math.min(100, styleScore + 5)
  }

  // 4. 平台适配度
  let platformScore = 40
  if (platform === 'midjourney') {
    if (lower.includes('--ar')) platformScore += 20
    if (lower.includes('--stylize') || lower.includes('--s ')) platformScore += 15
    if (lower.includes('--v')) platformScore += 15
    if (words > 60) platformScore += 10
    if (words > 100) platformScore += 10
  } else if (platform === 'stable-diffusion') {
    if (lower.includes('negative prompt')) platformScore += 25
    if (lower.includes('steps:')) platformScore += 10
    if (lower.includes('cfg')) platformScore += 10
    if (lower.includes('sampler')) platformScore += 10
    if (lower.includes('masterpiece')) platformScore += 5
    if (lower.includes('seed:')) platformScore += 5
  } else if (platform === 'flux') {
    if (words > 80) platformScore += 25
    if (charCount > 300) platformScore += 20
    if (charCount > 500) platformScore += 10
    if (lower.includes('lighting')) platformScore += 5
    if (lower.includes('composition')) platformScore += 5
  } else if (platform === 'jimeng') {
    const hasChinese = /[\u4e00-\u9fa5]/.test(prompt)
    if (hasChinese) platformScore += 30
    if (charCount > 50) platformScore += 15
    if (charCount > 100) platformScore += 15
  } else if (platform === 'dalle') {
    if (words > 50) platformScore += 25
    if (words > 100) platformScore += 20
    if (lower.includes('photograph')) platformScore += 10
    if (lower.includes('illustration')) platformScore += 10
  }
  platformScore = Math.min(100, platformScore)

  const total = Math.round((detailScore + compScore + styleScore + platformScore) / 4)

  const suggestions: string[] = []
  if (materialCount < 2) suggestions.push('缺少材质描述（丝绸、金属、木质、玻璃等），建议补充')
  if (lightingCount < 2) suggestions.push('光影系统不完整，建议添加光源类型、方向、强度描述')
  if (skinCount < 1 && (lower.includes('portrait') || lower.includes('face') || lower.includes('skin'))) suggestions.push('人物肤质细节缺失，建议添加 subsurface scattering、pore-level detail')
  if (lensCount < 1) suggestions.push('缺少镜头参数（焦段/光圈），建议添加如 85mm f/1.4')
  if (shotCount < 2) suggestions.push('缺少构图描述，建议添加景别（close-up/wide/portrait）和视角')
  if (dofCount < 1) suggestions.push('缺少景深描述，建议添加 depth of field、bokeh')
  if (styleScore < 60) suggestions.push('风格关键词匹配度低，建议强化风格特征词')
  if (platformScore < 70) suggestions.push('平台适配度不足，建议添加平台专属参数')
  if (words < 50) suggestions.push(`提示词偏短（${words}词），建议扩展到 80 词以上`)
  if (words > 200) suggestions.push('提示词过长，可能影响生成效果，建议精简到 150 词以内')
  if (total >= 85) suggestions.push(`提示词质量优秀，可直接复制到 ${platform} 使用！`)
  if (total >= 95) suggestions.push('完美！这是一个专业级别的提示词！')

  const hasAction = /(standing|sitting|walking|running|posing|holding|looking|gazing|smiling|dancing|flying|floating|action|pose|gesture|movement|reaching|touching|holding)/i.test(prompt)
  const hasColor = /(color|tone|warm|cool|palette|hue|golden|blue|red|purple|green|amber|teal|pink|orange|cyan|magenta)/i.test(prompt)
  const hasQuality = /(masterpiece|best quality|ultra detailed|8k|4k|high resolution|photorealistic|hd|uhd|hyper-realistic|highly detailed)/i.test(prompt)

  const missingItems: Array<{ label: string; description: string; missing: boolean; suggestion?: string }> = [
    { label: '动作描述', description: '主体在做什么', missing: !hasAction, suggestion: '添加主体动作：standing, walking, looking, holding...' },
    { label: '背景环境', description: '场景/背景/环境', missing: envCount === 0, suggestion: '添加环境描述：background, environment, scene, forest...' },
    { label: '镜头焦段', description: '镜头参数/焦段', missing: lensCount === 0, suggestion: '添加镜头参数：85mm, 50mm, f/1.4, wide angle...' },
    { label: '构图视角', description: '景别/视角/构图', missing: shotCount < 2, suggestion: '添加构图描述：close-up, portrait, wide shot, composition...' },
    { label: '景深描述', description: '景深/虚化/对焦', missing: dofCount === 0, suggestion: '添加景深：depth of field, bokeh, shallow focus...' },
    { label: '材质描述', description: '材质/纹理/质感', missing: materialCount < 2, suggestion: '添加材质：silk, metal, leather, crystal, wood...' },
    { label: '光影系统', description: '光源/方向/强度', missing: lightingCount < 2, suggestion: '添加光影：lighting, volumetric, rim light, soft light...' },
    { label: '色彩方案', description: '色调/色彩/氛围', missing: !hasColor, suggestion: '添加色彩：warm tones, golden, teal and orange, pastel...' },
    { label: '画质标签', description: '画质/分辨率/质量词', missing: !hasQuality, suggestion: '添加画质词：masterpiece, best quality, ultra detailed, 8k...' },
    { label: '风格关键词', description: '风格特征描述', missing: styleScore < 60, suggestion: '强化风格关键词：' + (styleKeywords[style]?.split(', ').slice(0, 3).join(', ') || '') },
  ]

  return { total, detail: detailScore, composition: compScore, style: styleScore, platform: platformScore, suggestions, missingItems }
}

// ==================== 提取标签 ====================

function extractTags(prompt: string, platform: string, camera?: string, lighting?: string, mood?: string, quality?: string, enhanceLevel?: string): string[] {
  const tags: string[] = []
  const cameraLabels: Record<string, string> = { 'close-up': '特写', 'portrait': '半身', 'full-body': '全身', 'wide-angle': '广角', 'bird-view': '鸟瞰', 'pov': '第一人称', 'aerial': '航拍' }
  const lightingLabels: Record<string, string> = { 'cinematic': '电影光', 'backlight': '逆光', 'soft': '柔光', 'volumetric': '体积光', 'neon': '霓虹光', 'moonlight': '月光' }
  const moodLabels: Record<string, string> = { 'dreamy': '梦幻', 'mysterious': '神秘', 'oppressive': '压抑', 'warm': '温馨', 'lonely': '孤独', 'epic': '史诗感' }
  const qualityLabels: Record<string, string> = { 'standard': '普通', 'high': '高级', 'master': '大师级' }
  const enhanceLabels: Record<string, string> = { 'basic': '基础版', 'pro': '专业版', 'master': '大师版' }

  if (camera && cameraLabels[camera]) tags.push(cameraLabels[camera])
  if (lighting && lightingLabels[lighting]) tags.push(lightingLabels[lighting])
  if (mood && moodLabels[mood]) tags.push(moodLabels[mood])
  if (quality && qualityLabels[quality]) tags.push(qualityLabels[quality])
  if (enhanceLevel && enhanceLabels[enhanceLevel]) tags.push(enhanceLabels[enhanceLevel])

  if (platform === 'midjourney') tags.push('Midjourney')
  if (platform === 'stable-diffusion') tags.push('SDXL')
  if (platform === 'flux') tags.push('Flux')
  if (platform === 'jimeng') tags.push('即梦')

  if (prompt.includes('8k')) tags.push('8K')
  if (prompt.includes('masterpiece')) tags.push('masterpiece')
  if (prompt.includes('photorealistic') || prompt.includes('hyper realistic')) tags.push('写实')
  if (prompt.includes('anime')) tags.push('动漫')
  if (prompt.includes('cinematic')) tags.push('电影感')

  return tags
}

// ==================== 主体驱动 Prompt 构建 ====================

interface GenerationContext {
  subjectType: SubjectType
  subjectLabel: string
  subjectContent: string[]
}

function buildSubjectDrivenPrompt(
  platform: string,
  subject: string,
  style: string,
  language: string,
  enhanceLevel: string,
  ctx: GenerationContext,
  details?: string,
  aspectRatio?: string,
  camera?: string,
  lighting?: string,
  mood?: string,
  quality?: string
): string {
  const isEnglish = language === 'en'
  const { subjectType, subjectLabel, subjectContent } = ctx

  // 风格增强配置（仅负责光影、镜头、色彩、氛围）
  const lightingEnhancement = lighting
    ? lightingLibrary[lighting] || lightingLibrary['cinematic']
    : lightingLibrary['cinematic']

  const cameraEnhancement = camera
    ? photographyLibrary[camera] || photographyLibrary['portrait']
    : photographyLibrary['cinematic']

  const colorEnhancement = mood
    ? matchColor(mood)
    : matchColor('warm')

  // 增强等级配置
  const levelConfig = {
    basic: { subjectCount: 4, styleCount: 2, minWords: 30 },
    pro: { subjectCount: 6, styleCount: 3, minWords: 80 },
    master: { subjectCount: 8, styleCount: 4, minWords: 150 },
  }
  const config = levelConfig[enhanceLevel] || levelConfig.pro

  // 构建主体内容（70%）
  const subjectPhrases = subjectContent.slice(0, config.subjectCount)
  const subjectSection = subjectPhrases.join(', ')

  // 构建风格增强（20%）
  const stylePhrases = [
    ...lightingEnhancement.slice(0, config.styleCount),
    ...cameraEnhancement.slice(0, config.styleCount),
    ...colorEnhancement.slice(0, 2),
  ]

  // 平台后缀
  const suffix = formatPlatformSuffix(platform, aspectRatio)

  // 构建完整Prompt - 明确要求自然语言段落，禁止tag格式
  if (isEnglish) {
    return `You are a world-class AI image prompt engineer. Generate a ${config.minWords}+ word English prompt for ${platform}.

CRITICAL OUTPUT FORMAT: You MUST output a NATURAL LANGUAGE PARAGRAPH, NOT tag/comma-separated format.
DO NOT use: "1girl, solo, blonde hair, blue eyes" format
DO use: "A beautiful young woman with long flowing blonde hair and striking blue eyes, wearing..." format

SUBJECT-DRIVEN ARCHITECTURE:

1. SUBJECT (70% of content):
   The subject type is "${subjectLabel}".
   Core description: ${subjectSection}.
   ${details ? `Additional details: ${details}.` : ''}
   Describe the subject in rich, flowing natural language sentences.

2. ATMOSPHERE (20% - lighting/camera/color/mood only):
   - Lighting: ${stylePhrases.slice(0, 2).join(', ')}
   - Camera: ${stylePhrases.slice(2, 4).join(', ')}
   - Color: ${colorEnhancement.slice(0, 3).join(', ')}

3. QUALITY (10%):
   ${matchQuality(quality || 'high').join(', ')}

${platform === 'midjourney' ? `PLATFORM: Add "${suffix}" at the end.` : ''}
${platform === 'stable-diffusion' ? 'Output natural language paragraph.' : ''}
${platform === 'flux' ? 'Output as flowing natural-language paragraph.' : ''}

RULES:
- ${config.minWords}+ words minimum
- SUBJECT is the hero — describe it in DETAILED NATURAL LANGUAGE
- Style only controls atmosphere (lighting, camera, color, mood)
- NO tag format, NO comma-separated keywords
- Output ONLY the final prompt text. No explanations, no markdown, no JSON.`
  }

  // 中文版本 - 明确要求自然语言段落
  return `你是一位世界级 AI 绘图提示词工程师。请为 ${platform} 生成 ${config.minWords}+ 词的中文提示词。

关键输出格式：你必须输出自然语言段落，禁止使用标签/逗号分隔格式。
禁止格式："1girl, solo, blonde hair, blue eyes"
正确格式："一位美丽的年轻女性，拥有飘逸的金色长发和迷人的蓝色眼眸，身着..."

主体驱动架构：

1. 主体（70%内容）：
   主体类型："${subjectLabel}"
   核心描述：${subjectSection}
   ${details ? `补充细节：${details}` : ''}
   使用流畅的自然语言详细描述主体。

2. 氛围增强（20% - 仅光影/镜头/色彩/氛围）：
   - 光影：${stylePhrases.slice(0, 2).join('、')}
   - 镜头：${stylePhrases.slice(2, 4).join('、')}
   - 色彩：${colorEnhancement.slice(0, 3).join('、')}

3. 画质（10%）：
   ${matchQuality(quality || 'high').join('、')}

${platform === 'midjourney' ? `平台适配：末尾添加"${suffix}"` : ''}
${platform === 'stable-diffusion' ? '输出自然语言段落。' : ''}
${platform === 'flux' ? '输出自然语言段落。' : ''}

规则：
- 至少 ${config.minWords} 词
- 主体是主角 — 用详细的自然语言描述
- 风格层只控制氛围（光影、镜头、色彩、情绪）
- 禁止标签格式、禁止逗号分隔关键词
- 只输出最终提示词，不要解释、markdown、JSON`
}

// ==================== 一键优化 Prompt 构建 ====================

function buildOptimizePrompt(platform: string, originalPrompt: string, style: string, language: string): string {
  const isEnglish = language === 'en'
  const styleGuide = style ? (styleKeywords[style] || style) : ''

  if (isEnglish) {
    return `Enhance this AI image prompt for ${platform}. Make it photography-grade with these additions:

1. Add camera specs (lens, aperture, shot type)
2. Add lighting system (source, direction, quality, shadows)
3. Add material textures
4. Add composition details
5. ${styleGuide ? `Strengthen style: ${styleGuide}` : 'Enhance artistic style'}

Original: "${originalPrompt}"

Output ONLY the enhanced prompt. No explanations.`
  }

  return `优化这条 ${platform} 提示词，提升至摄影级品质，补充以下内容：

1. 镜头参数（焦段、光圈、景别）
2. 光影系统（光源、方向、质感、阴影）
3. 材质纹理
4. 构图细节
5. ${styleGuide ? `强化风格：${styleGuide}` : '增强艺术风格'}

原提示词："${originalPrompt}"

只输出优化后的提示词，不要解释。`
}

// ==================== 处理器 ====================

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const {
    platform, subject, style, details, negativePrompt, aspectRatio,
    model, language, camera, lighting, mood, quality, enhanceLevel,
    useTemplate, templateId,
  } = validateBody(req, promptGenerateSchema)

  // 确保模板库已加载
  loadTemplates()

  // ==================== 优先级 1：模板驱动模式 ====================
  let templateUsed: string | null = null

  if (useTemplate !== false) {
    // 获取模板：指定 ID > 随机匹配
    const tpl = templateId
      ? (getTemplatesByPlatformAndStyle(platform, style).find((t) => t.id === templateId) || null)
      : getRandomTemplate(platform, style)

    if (tpl) {
      templateUsed = tpl.id
      recordTemplateUse(tpl.id)

      // 变量替换
      const filledTemplate = replacePlaceholders(tpl.template, {
        subject, scene: details, lighting, camera, quality,
        style: style, mood, details,
      }, style)

      let generatedPrompt: string
      let negativePromptFull: string | undefined

      if (isLlmConfigured()) {
        // AI 润色 — 基于模板填充结果进行优化，支持翻译
        const polishPrompt = language === 'en'
          ? `Polish and enhance this prompt for ${platform}. Keep the original structure and keywords, but improve fluency and add subtle details where appropriate. Output ONLY the final prompt: ${filledTemplate}`
          : `请将以下 ${platform} 提示词翻译成中文，并进行润色优化。保持原有结构和关键词，提升流畅度并在适当位置增加微妙细节。确保输出完全是中文。只输出最终提示词：${filledTemplate}`

        generatedPrompt = await chatCompletion(
          [
            { role: 'system', content: language === 'en'
              ? 'You are a prompt polishing expert. Polish the given prompt. Output ONLY the polished prompt, no explanations.'
              : '你是提示词翻译润色专家。将英文提示词翻译成中文并进行优化，只输出最终中文提示词。'
            },
            { role: 'user', content: polishPrompt },
          ],
          { temperature: 0.3, maxTokens: 2048, model: model || undefined, language: language || undefined }
        )
        generatedPrompt = generatedPrompt.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
      } else {
        // 无 AI 时直接使用模板填充结果
        generatedPrompt = filledTemplate
      }

      if (platform === 'stable-diffusion' && negativePrompt) {
        negativePromptFull = `(worst quality, low quality:1.4), (blurry:1.2), ${negativePrompt}`
      }

      const platformParams = getPlatformParams(platform, aspectRatio)
      const qualityScore = scorePrompt(generatedPrompt, platform, style)
      const tags = extractTags(generatedPrompt, platform, camera, lighting, mood, quality, enhanceLevel)

      return successResponse(res, {
        id: crypto.randomUUID(),
        platform, subject, style,
        details: details || null,
        negative_prompt: negativePrompt || null,
        generated_prompt: generatedPrompt,
        negative_prompt_full: negativePromptFull || null,
        aspect_ratio: aspectRatio || tpl.aspectRatio || '9:16',
        camera: camera || null, lighting: lighting || null, mood: mood || null, quality: quality || null,
        enhance_level: enhanceLevel,
        model: model || null, language: language || 'cn',
        platform_params: platformParams,
        quality_score: qualityScore,
        tags,
        template_id: templateUsed,
        template_name: tpl.name,
        mode: 'template',
      })
    }
  }

  // ==================== 优先级 2：AI 自由生成模式（主体驱动引擎） ====================

  // 识别主体类型并生成主体内容
  const subjectType = detectSubjectType(subject)
  const { label: subjectLabel } = getSubjectTypeLabel(subjectType)
  const subjectContent = generateSubjectContent(subjectType, subject, details, enhanceLevel === 'master' ? 8 : enhanceLevel === 'pro' ? 6 : 4)

  const genCtx: GenerationContext = {
    subjectType,
    subjectLabel,
    subjectContent,
  }

  const subjectDrivenPrompt = buildSubjectDrivenPrompt(
    platform, subject, style, language, enhanceLevel,
    genCtx, details, aspectRatio, camera, lighting, mood, quality
  )

  let generatedPrompt: string
  let negativePromptFull: string | undefined

  if (!isLlmConfigured()) {
    // Fallback — 使用知识库生成高质量模板 Prompt（主体驱动）
    const photoKw = camera ? matchPhotography(camera) : matchPhotography('portrait')
    const lightKw = lighting ? matchLighting(lighting) : matchLighting('cinematic')
    const qualityKw = matchQuality(quality || 'high')
    const colorKw = matchColor(mood)

    // 主体内容（70%）
    const subjectPart = subjectContent.slice(0, 4).join(', ')
    // 风格增强（20%）
    const stylePart = [
      ...lightKw.slice(0, 2),
      ...photoKw.slice(0, 2),
      ...colorKw.slice(0, 2),
    ].join(', ')
    // 画质（10%）
    const qualityPart = qualityKw.join(', ')

    const parts: string[] = [subjectPart]
    parts.push(stylePart)
    parts.push(qualityPart)

    generatedPrompt = parts.join(', ')
    if (platform === 'midjourney') {
      generatedPrompt += formatPlatformSuffix(platform, aspectRatio)
    }
    if (platform === 'stable-diffusion' && negativePrompt) {
      negativePromptFull = `(worst quality, low quality:1.4), (blurry:1.2), ${negativePrompt}`
    }
  } else {
    const systemPrompt = language === 'en'
      ? 'You are a world-class AI image prompt engineer. OUTPUT NATURAL LANGUAGE PARAGRAPH ONLY. Never use tag/comma-separated format. Do NOT output: "1girl, solo, blue eyes". DO output: "A beautiful young woman with..." Style and quality additions are allowed. Output ONLY the final prompt. No explanations, no markdown, no JSON.'
      : '你是一位世界级 AI 绘图提示词工程师。只输出自然语言段落。禁止标签/逗号分隔格式。禁止输出："1girl, solo, blue eyes"。正确输出："一位美丽的年轻女性，拥有..." 风格和画质描述可以添加。只输出最终提示词，不要解释、markdown、代码块、JSON。'

    generatedPrompt = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: subjectDrivenPrompt },
      ],
      { temperature: 0.4, maxTokens: 3072, model: model || undefined, language: language || undefined }
    )

    generatedPrompt = generatedPrompt.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
  }

  const platformParams = getPlatformParams(platform, aspectRatio)
  const qualityScore = scorePrompt(generatedPrompt, platform, style)
  const tags = extractTags(generatedPrompt, platform, camera, lighting, mood, quality, enhanceLevel)

  const result = {
    id: crypto.randomUUID(),
    platform, subject, style,
    details: details || null,
    negative_prompt: negativePrompt || null,
    generated_prompt: generatedPrompt,
    negative_prompt_full: negativePromptFull || null,
    aspect_ratio: aspectRatio,
    camera: camera || null, lighting: lighting || null, mood: mood || null, quality: quality || null,
    enhance_level: enhanceLevel,
    model: model || null, language: language || 'cn',
    platform_params: platformParams,
    quality_score: qualityScore,
    tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (supabase) {
    try {
      const { data } = await supabase.from('prompts').insert(result).select().single()
      if (data) {
        await supabase.from('user_history').insert({
          action_type: 'prompt',
          title: `提示词生成：${subject.slice(0, 30)}...`,
          description: `为 ${platform} 生成 ${enhanceLevel === 'master' ? '大师版' : enhanceLevel === 'pro' ? '专业版' : '基础版'} AI 绘图提示词`,
          metadata: { prompt_id: data.id, platform, style, enhanceLevel, model, language },
        })
        return successResponse(res, data)
      }
    } catch {
      console.warn('Supabase unavailable, returning in-memory result')
    }
  }

  return successResponse(res, result)
}

// ==================== 一键优化处理器 ====================

async function optimizeHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { prompt, platform, style, model, language } = validateBody(req, promptOptimizeSchema)

  if (!isLlmConfigured()) {
    return errorResponse(res, '请先配置 AI 模型 API Key', 500)
  }

  const optimizePrompt = buildOptimizePrompt(platform, prompt, style || '', language)

  const systemPrompt = language === 'en'
    ? 'You are a world-class AI image prompt optimizer. Enhance the given prompt with camera specs, lighting, materials, and composition. Output ONLY the enhanced prompt.'
    : '你是一位世界级 AI 提示词优化师。为给定提示词补充镜头、光影、材质、构图细节。只输出优化后的提示词。'

  let optimized = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: optimizePrompt },
    ],
    { temperature: 0.3, maxTokens: 3072, model: model || undefined, language: language || undefined }
  )

  optimized = optimized.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()

  const qualityScore = scorePrompt(optimized, platform, style || 'cinematic')

  return successResponse(res, {
    original_prompt: prompt,
    optimized_prompt: optimized,
    quality_score: qualityScore,
    improvement: {
      originalScore: scorePrompt(prompt, platform, style || 'cinematic').total,
      optimizedScore: qualityScore.total,
      improvement: qualityScore.total - scorePrompt(prompt, platform, style || 'cinematic').total,
    },
  })
}

// 路由分发
export default function router(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && req.url?.includes('optimize')) {
    return withErrorHandler(optimizeHandler)(req, res)
  }
  return withErrorHandler(handler)(req, res)
}