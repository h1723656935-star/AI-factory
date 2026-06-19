// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { chatCompletion, isLlmConfigured } from '@/lib/llm'
import { withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { videoAnalysisSchema2 } from '@/lib/schemas'

const videoKeywords = {
  shots: {
    closeUp: 'close-up shot, intimate framing',
    medium: 'medium shot, balanced composition',
    wide: 'wide shot, environmental context',
    aerial: 'aerial shot, bird eye view',
    tracking: 'tracking shot, following subject',
    handheld: 'handheld camera, natural movement',
    static: 'static tripod shot, stable framing',
    dolly: 'dolly zoom, vertigo effect',
    crane: 'crane shot, sweeping elevation',
    POV: 'POV shot, first person perspective',
  },
  movements: {
    pan: 'panning movement, horizontal reveal',
    tilt: 'tilt movement, vertical reveal',
    zoom: 'zoom in/out, focal change',
    push: 'push in, approaching subject',
    pull: 'pull out, revealing context',
    orbit: 'orbital movement, circling subject',
    steadicam: 'steadicam, smooth floating movement',
    whip: 'whip pan, fast transition',
  },
  transitions: {
    cut: 'hard cut, immediate change',
    dissolve: 'dissolve, overlapping fade',
    fade: 'fade to black/white',
    wipe: 'wipe transition, directional reveal',
    match: 'match cut, visual continuity',
    jump: 'jump cut, time discontinuity',
    morph: 'morph transition, shape transformation',
    glitch: 'glitch transition, digital distortion',
  },
  moods: {
    epic: 'epic, grand, heroic',
    intimate: 'intimate, personal, close',
    tense: 'tense, suspenseful, anxious',
    dreamy: 'dreamy, ethereal, floating',
    dark: 'dark, moody, noir',
    energetic: 'energetic, fast-paced, dynamic',
    calm: 'calm, peaceful, serene',
    mysterious: 'mysterious, enigmatic, cryptic',
  },
  styles: {
    cinematic: 'cinematic style, film look, anamorphic, 24fps',
    documentary: 'documentary style, realistic, natural lighting',
    musicVideo: 'music video style, stylized, rhythmic editing',
    commercial: 'commercial style, polished, high production value',
    anime: 'anime style, 2D animation, cel shading',
    vintage: 'vintage film look, grain, sepia, 8mm',
    cyberpunk: 'cyberpunk aesthetic, neon, futuristic, dystopian',
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }
  if (!applyRateLimit(req, res, 'ai')) return

  const { videoBase64, videoUrl, language, model } = req.body

  if (!isLlmConfigured()) {
    const fallback = {
      subject: '人物主体',
      shotTypes: ['close-up shot', 'medium shot', 'tracking shot'],
      cameraMovements: ['push in', 'panning movement', 'orbit shot'],
      pacing: 'moderate',
      transitions: ['hard cut', 'dissolve'],
      visualStyle: 'cinematic',
      colorPalette: ['warm tones', 'golden', 'amber'],
      mood: 'epic',
      prompts: {
        jimeng: '电影感画面，人物特写，推镜头，暖色调，金色光线，电影级画质',
        keling: 'cinematic close-up shot, push in camera movement, warm golden lighting, film quality, 24fps, anamorphic lens',
        runway: 'Cinematic portrait shot with slow push-in movement. Warm golden hour lighting. Film grain, 24fps. Shallow depth of field.',
        ltx: 'cinematic, close-up, push in, warm lighting, golden hour, film grain, 24fps, anamorphic',
        veo: 'A cinematic close-up shot with a slow push-in camera movement. The scene is bathed in warm golden hour light. Shot on anamorphic lenses at 24fps with film grain.',
      },
      tags: ['电影感', '特写', '推镜头', '暖色调', '24fps'],
    }
    return successResponse(res, fallback)
  }

  const isEnglish = language === 'en'
  const systemPrompt = isEnglish
    ? `You are a professional video analyst. Analyze the video and output a JSON object with these fields:
{
  "subject": "main subject of the video",
  "shotTypes": ["list of shot types used"],
  "cameraMovements": ["list of camera movements"],
  "pacing": "slow/moderate/fast",
  "transitions": ["list of transition types"],
  "visualStyle": "overall visual style",
  "colorPalette": ["list of colors and tones"],
  "mood": "emotional atmosphere",
  "prompts": {
    "jimeng": "Chinese prompt for Jimeng AI",
    "keling": "English prompt for Keling AI",
    "runway": "English prompt for Runway",
    "ltx": "English prompt for LTX",
    "veo": "English prompt for Veo"
  },
  "tags": ["relevant tags"]
}
Output ONLY valid JSON. No markdown, no code blocks, no explanations.`
    : `你是专业视频分析师。分析视频并输出JSON，包含：subject, shotTypes, cameraMovements, pacing, transitions, visualStyle, colorPalette, mood, prompts(含jimeng/keling/runway/ltx/veo), tags。只输出JSON。`

  let userPrompt: string
  if (videoUrl) {
    userPrompt = isEnglish
      ? `Analyze this video URL: ${videoUrl}. Generate structured analysis with prompts for AI video generation platforms.`
      : `分析视频链接：${videoUrl}。生成结构化分析，并为AI视频生成平台生成对应的提示词。`
  } else if (videoBase64) {
    userPrompt = isEnglish
      ? `Analyze the video content provided. Identify the visual composition, camera movements, editing style, color grading, and emotional tone. Generate structured analysis with prompts for AI video generation platforms.`
      : `分析提供的视频内容。识别视觉构图、镜头运动、剪辑风格、色彩分级和情感基调。生成结构化分析，并为AI视频生成平台生成对应的提示词。`
  } else {
    userPrompt = isEnglish
      ? 'Analyze this video content and generate structured analysis with prompts for AI video generation platforms.'
      : '分析这个视频内容，生成结构化分析，并为AI视频生成平台生成对应的提示词。'
  }

  try {
    const text = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.4, maxTokens: 2048, responseFormat: 'json', model: model || undefined, language: language || undefined }
    )

    const cleaned = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim()
    const result = JSON.parse(cleaned)
    return successResponse(res, result)
  } catch {
    return errorResponse(res, '视频分析失败，请稍后重试', 500)
  }
}

export default withErrorHandler(handler)