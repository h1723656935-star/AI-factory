import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletionJson, isLlmConfigured } from '@/lib/llm'
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
  frameCount: number
): Promise<StoryboardFrame[]> {
  const systemPrompt = `你是一位短视频分镜设计师。请根据用户提供的脚本，生成指定数量的分镜。

每个分镜必须输出 JSON 字段：
- sceneNumber：镜头序号
- description：中文画面描述，必须紧扣脚本内容，包含景别、机位和镜头运动
- visualPrompt：英文 AI 绘图提示词，必须具体，包含主体、环境、光线、色彩、氛围、画质词
- duration：时长，如"3秒"或"5秒"
- camera：拍摄建议（可选）
- lighting：光线方案（可选）
- audio：声音提示（可选）

铁律：
1. 所有分镜必须基于脚本内容，禁止生成与脚本无关的画面。
2. 视觉提示词禁止抽象，必须可绘图。
3. 第一个镜头 3 秒，其他 4-7 秒。
4. 只输出 JSON，不要解释。

示例（必须严格按此格式）：
{
  "frames": [
    {
      "sceneNumber": 1,
      "description": "特写：主角手持食材，面向镜头微笑",
      "visualPrompt": "extremely detailed close-up of a chef holding fresh ingredients, warm kitchen lighting, shallow depth of field, masterpiece, best quality, highly detailed, 8k uhd",
      "duration": "3秒",
      "camera": "手机近景",
      "lighting": "暖光侧逆",
      "audio": "轻快节奏切入"
    }
  ]
}`;

  const result = await chatCompletionJson<LlmStoryboardResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请将以下脚本转化为 ${frameCount} 个分镜。\n\n画面风格：${styleLabels[style] || style}\n\n脚本内容：\n###\n${scriptContent}\n###\n\n请输出 JSON 格式的分镜。` },
    ],
    { temperature: 0.5, maxTokens: 4096 }
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

  const { scriptId, scriptContent: providedScript, style, frameCount } = validateBody(
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
  const frames = await generateWithLlm(scriptContent, style, frameCount)

  const result = {
    id: crypto.randomUUID(),
    script_id: linkedScriptId,
    frames,
    style,
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
          metadata: { storyboard_id: data.id, style, frame_count: frames.length },
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
