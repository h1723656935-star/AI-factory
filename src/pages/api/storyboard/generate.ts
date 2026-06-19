// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletionJson, isLlmConfigured, getAvailableModels } from '@/lib/llm'
import {
  validateBody,
  withErrorHandler,
  errorResponse,
  successResponse,
} from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { storyboardGenerateSchema } from '@/lib/schemas'
import type { StoryboardFrame } from '@/types'

const supabase = createAdminClient()

const styleLabels: Record<string, string> = {
  cinematic: '电影感',
  anime: '动漫风',
  realistic: '写实',
  minimal: '极简',
  vintage: '复古',
  cyberpunk: '赛博朋克',
  fantasy: '奇幻',
  noir: '暗黑',
  watercolor: '水彩',
  'oil-painting': '油画',
  '3d-render': '3D渲染',
  'pixel-art': '像素风',
  comic: '漫画',
  sketch: '素描',
  surreal: '超现实',
  gothic: '哥特',
}

const demoFrames: StoryboardFrame[] = [
  {
    id: '1',
    sceneNumber: 1,
    description: '开场镜头：主角站在城市天台，逆光剪影',
    visualPrompt: 'A silhouette of a creator standing on a city rooftop at golden hour, cinematic lighting, wide angle, 8k',
    duration: '3秒',
  },
  {
    id: '2',
    sceneNumber: 2,
    description: '特写：手机屏幕亮起，显示爆款数据',
    visualPrompt: 'Close-up of a smartphone screen showing viral analytics numbers, glowing interface, shallow depth of field',
    duration: '5秒',
  },
  {
    id: '3',
    sceneNumber: 3,
    description: '中景：主角兴奋地握拳',
    visualPrompt: 'Medium shot of an excited creator fist pumping, neon city lights in background, cyberpunk aesthetic',
    duration: '5秒',
  },
  {
    id: '4',
    sceneNumber: 4,
    description: '转场：快速剪辑多个爆款画面',
    visualPrompt: 'Fast montage of viral video thumbnails floating in digital space, holographic, futuristic',
    duration: '5秒',
  },
  {
    id: '5',
    sceneNumber: 5,
    description: '结尾：主角面对镜头微笑，出现 logo',
    visualPrompt: 'Creator smiling confidently at camera, gold and black color scheme, logo reveal, professional studio lighting',
    duration: '5秒',
  },
]

interface LlmStoryboardResult {
  frames: Array<{
    sceneNumber: number
    description: string
    visualPrompt: string
    duration: string
    camera?: string
    lighting?: string
    audio?: string
  }>
}

async function generateWithLlm(
  scriptContent: string,
  style: string,
  frameCount: number,
  language: 'cn' | 'en',
  model?: string
): Promise<StoryboardFrame[]> {
  const styleLabel = styleLabels[style] || style

  const systemPromptCn = `你是一位世界顶级的短视频分镜设计师，曾为多个国际品牌和一线导演服务。你的任务是将用户提供的脚本转化为高度专业、视觉冲击力极强的分镜方案。

每个分镜必须输出以下 JSON 字段：
- sceneNumber：镜头序号（从 1 开始递增）
- description：中文画面描述，必须紧扣脚本内容，描述景别（特写/中景/全景/远景）、机位角度（俯拍/仰拍/平视/鸟瞰）、镜头运动（推/拉/摇/移/跟/升/降）、构图方式，以及画面中的人物动作和情绪。要求 50 字以上。
- visualPrompt：英文 AI 绘图提示词，必须极其详细（至少 50 个英文单词），必须包含以下要素：
  * 主体（subject）及动作/姿态
  * 环境与背景（environment）
  * 构图与镜头类型（composition, shot type, angle, camera movement）
  * 光线方案（lighting source, quality, color temperature）
  * 色彩调性（color palette）
  * 氛围与情绪（mood/atmosphere）
  * 艺术风格（art style）
  * 画质标签（masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed 等）
- duration：时长，如"3秒"或"5秒"
- camera：中文拍摄建议，包含镜头焦段和运镜方式（可选）
- lighting：中文光线方案，包含光源方向和光质（可选）
- audio：中文声音提示，包含配乐风格和音效（可选）

铁律：
1. 所有分镜必须严格基于脚本内容，禁止生成与脚本无关的画面，禁止凭空捏造剧情。
2. visualPrompt 必须极其具体、可绘图，禁止使用抽象词汇。每个 visualPrompt 不少于 50 个英文单词。
3. 第一个镜头默认为 3 秒作为开场，其余镜头 4-7 秒。动作密集的镜头可适当延长。
4. 分镜之间要有视觉节奏变化——景别交替（特写→全景→中景→特写），避免单调重复。
5. 只输出 JSON，不要任何解释、开场白或结尾语。

示例（必须严格按此格式）：
{
  "frames": [
    {
      "sceneNumber": 1,
      "description": "特写镜头：主角面部占据画面三分之二，眼神坚定直视镜头，柔和暖光从左侧 45 度打来，形成柔和的伦勃朗光，背景虚化为模糊的城市夜景光斑，镜头缓慢推进营造紧张感。",
      "visualPrompt": "extreme close-up of a young Asian man's face, intense determined eyes staring directly into camera, Rembrandt lighting with soft warm key light from 45 degrees left, subtle fill light from right, shallow depth of field with bokeh city lights in background at night, cinematic composition using rule of thirds, slight dolly-in camera movement, warm amber and teal color palette, dramatic and suspenseful atmosphere, photorealistic, hyper-detailed skin texture, film grain, masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed, shot on Arri Alexa 65mm",
      "duration": "3秒",
      "camera": "85mm 定焦，极浅景深，缓慢推镜",
      "lighting": "左侧暖光主光 + 右侧微弱补光，伦勃朗三角光",
      "audio": "低沉的弦乐渐入，心跳声效"
    },
    {
      "sceneNumber": 2,
      "description": "全景俯拍：主角独自站在空旷的现代化办公室中央，阳光从落地窗倾泻而入在地面形成几何光影，主角双手插兜抬头仰望天花板，镜头从高空缓慢下降，营造孤独与希望交织的氛围。",
      "visualPrompt": "bird's eye view wide shot of a solitary figure standing in the center of a vast modern minimalist office space, floor-to-ceiling glass windows with golden sunlight streaming through casting geometric shadow patterns on polished concrete floor, the person looking up towards the ceiling with hands in pockets, slow crane descending camera movement, volumetric light rays visible in the air, warm golden and cool gray color palette, contemplative and hopeful atmosphere, architectural photography style, clean lines, symmetrical composition, masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed, cinematic lighting",
      "duration": "5秒",
      "camera": "摇臂俯拍下降，24mm 广角",
      "lighting": "自然光为主，落地窗大面积进光，形成体积光",
      "audio": "钢琴单音渐起，环境混响"
    }
  ]
}`

  const systemPromptEn = `You are a world-class short-video storyboard designer who has worked with major international brands and top-tier directors. Your task is to transform the user's script into a highly professional, visually stunning storyboard sequence.

Each shot must output the following JSON fields:
- sceneNumber: sequential shot number starting from 1
- description: Chinese visual description, must closely follow the script, describing shot size (close-up/medium/wide/extreme-wide), camera angle (high-angle/low-angle/eye-level/bird's-eye), camera movement (push/pull/pan/tilt/track/follow/crane), composition, character actions, and emotions. Minimum 50 Chinese characters.
- visualPrompt: English AI image generation prompt, must be extremely detailed (minimum 50 English words), must include:
  * Subject with action/pose
  * Environment and background
  * Composition, shot type, angle, camera movement
  * Lighting (source, quality, color temperature)
  * Color palette
  * Mood and atmosphere
  * Art style
  * Quality tags (masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed, etc.)
- duration: duration like "3 seconds" or "5 seconds"
- camera: Chinese shooting suggestion including lens focal length and camera movement (optional)
- lighting: Chinese lighting scheme including light source direction and quality (optional)
- audio: Chinese audio suggestion including music style and sound effects (optional)

Iron rules:
1. Every shot must be strictly based on the script content. Do NOT generate shots unrelated to the script. Do NOT invent plot elements.
2. visualPrompt must be extremely specific and paintable. No abstract language. Each visualPrompt must be at least 50 English words.
3. The first shot defaults to 3 seconds as an opening. Remaining shots are 4-7 seconds. Action-intensive shots may be slightly longer.
4. Alternate shot sizes across frames (close-up → wide → medium → close-up) to create visual rhythm. Avoid monotonous repetition.
5. Output ONLY JSON. No explanations, no opening remarks, no closing statements.

Example (must follow this exact format):
{
  "frames": [
    {
      "sceneNumber": 1,
      "description": "特写镜头：主角面部占据画面三分之二，眼神坚定直视镜头，柔和暖光从左侧 45 度打来，形成柔和的伦勃朗光，背景虚化为模糊的城市夜景光斑，镜头缓慢推进营造紧张感。",
      "visualPrompt": "extreme close-up of a young Asian man's face, intense determined eyes staring directly into camera, Rembrandt lighting with soft warm key light from 45 degrees left, subtle fill light from right, shallow depth of field with bokeh city lights in background at night, cinematic composition using rule of thirds, slight dolly-in camera movement, warm amber and teal color palette, dramatic and suspenseful atmosphere, photorealistic, hyper-detailed skin texture, film grain, masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed, shot on Arri Alexa 65mm",
      "duration": "3秒",
      "camera": "85mm 定焦，极浅景深，缓慢推镜",
      "lighting": "左侧暖光主光 + 右侧微弱补光，伦勃朗三角光",
      "audio": "低沉的弦乐渐入，心跳声效"
    },
    {
      "sceneNumber": 2,
      "description": "全景俯拍：主角独自站在空旷的现代化办公室中央，阳光从落地窗倾泻而入在地面形成几何光影，主角双手插兜抬头仰望天花板，镜头从高空缓慢下降，营造孤独与希望交织的氛围。",
      "visualPrompt": "bird's eye view wide shot of a solitary figure standing in the center of a vast modern minimalist office space, floor-to-ceiling glass windows with golden sunlight streaming through casting geometric shadow patterns on polished concrete floor, the person looking up towards the ceiling with hands in pockets, slow crane descending camera movement, volumetric light rays visible in the air, warm golden and cool gray color palette, contemplative and hopeful atmosphere, architectural photography style, clean lines, symmetrical composition, masterpiece, best quality, highly detailed, 8k uhd, ultra-detailed, cinematic lighting",
      "duration": "5秒",
      "camera": "摇臂俯拍下降，24mm 广角",
      "lighting": "自然光为主，落地窗大面积进光，形成体积光",
      "audio": "钢琴单音渐起，环境混响"
    }
  ]
}`

  const systemPrompt = language === 'en' ? systemPromptEn : systemPromptCn

  const userPrompt =
    language === 'en'
      ? `Please convert the following script into ${frameCount} storyboard shots.\n\nVisual style: ${styleLabel}\n\nScript content:\n###\n${scriptContent}\n###\n\nOutput JSON format storyboard.`
      : `请将以下脚本转化为 ${frameCount} 个分镜。\n\n画面风格：${styleLabel}\n\n脚本内容：\n###\n${scriptContent}\n###\n\n请输出 JSON 格式的分镜。`

  const result = await chatCompletionJson<LlmStoryboardResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.75, maxTokens: 8192, language, model }
  )

  return (result.frames || []).slice(0, frameCount).map((frame) => ({
    id: crypto.randomUUID(),
    sceneNumber: frame.sceneNumber,
    description: [
      frame.description,
      frame.camera ? `【拍摄】${frame.camera}` : '',
      frame.lighting ? `【光线】${frame.lighting}` : '',
      frame.audio ? `【声音】${frame.audio}` : '',
    ]
      .filter(Boolean)
      .join(' / '),
    visualPrompt: frame.visualPrompt,
    duration: frame.duration,
  }))
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { scriptId, scriptContent: providedScript, style, frameCount, model, language } = validateBody(
    req,
    storyboardGenerateSchema
  )

  let scriptContent = providedScript || ''
  let linkedScriptId: string | null = scriptId || null

  // 如果提供了 scriptId，从数据库读取脚本内容
  if (scriptId && supabase) {
    try {
      const { data: script } = await supabase
        .from('scripts')
        .select('content')
        .eq('id', scriptId)
        .single()

      if (script?.content) {
        scriptContent = script.content
      }
    } catch {
      // 忽略数据库错误
    }
  }

  if (!scriptContent.trim()) {
    return errorResponse(res, '请提供脚本内容或有效的脚本ID', 400)
  }

  // 未配置 LLM 时返回演示分镜
  if (!isLlmConfigured()) {
    const fallback = {
      id: crypto.randomUUID(),
      script_id: linkedScriptId,
      frames: demoFrames.slice(0, frameCount),
      style,
      model: model || null,
      language,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (supabase) {
      try {
        const { data } = await supabase
          .from('storyboards')
          .insert({
            script_id: linkedScriptId,
            frames: fallback.frames,
            style,
            model: model || null,
            language,
          })
          .select()
          .single()
        if (data) return successResponse(res, data)
      } catch {
        console.warn('Supabase 未配置，返回本地演示数据')
      }
    }

    return successResponse(res, fallback)
  }

  // 调用 LLM 生成分镜
  const frames = await generateWithLlm(scriptContent, style, frameCount, language, model)

  const result = {
    id: crypto.randomUUID(),
    script_id: linkedScriptId,
    frames,
    style,
    model: model || null,
    language,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // 尝试写入数据库
  if (supabase) {
    try {
      const { data } = await supabase
        .from('storyboards')
        .insert(result)
        .select()
        .single()

      if (data) {
        await supabase.from('user_history').insert({
          action_type: 'storyboard',
          title: `分镜设计：${scriptContent.slice(0, 30)}...`,
          description: `生成了 ${frames.length} 帧 ${styleLabels[style] || style} 风格分镜`,
          metadata: { storyboard_id: data.id, style, frame_count: frames.length, model, language },
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