import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletionJson, isLlmConfigured } from '@/lib/llm'
import { parseVideoUrl } from '@/lib/video-parser'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { videoAnalysisSchema } from '@/lib/schemas'
import type { VideoAnalysis } from '@/types'
import { createDatabaseOperation } from '@/lib/database'

const supabase = createAdminClient()
const db = createDatabaseOperation(supabase)

const demoResult: Partial<VideoAnalysis> = {
  platform: 'douyin',
  status: 'complete',
  title_analysis: {
    mainTitle: '这条视频为什么能火？深度拆解爆款密码',
    subTitle: '揭秘短视频流量密码，看完你也能做爆款',
    keywords: ['爆款', '流量', '短视频', '密码', '拆解'],
    sentiment: 'positive',
  },
  emotional_hooks: [
    { type: 'curiosity', strength: 85, content: '你知道为什么别人的视频能上热门吗？' },
    { type: 'surprise', strength: 70, content: '这条视频只用了3秒就抓住了观众注意力' },
    { type: 'joy', strength: 60, content: '看完这个技巧，你会发现原来这么简单' },
  ],
  conflict_points: [
    { timestamp: '00:05', description: '观众期待vs现实反差', intensity: 90 },
    { timestamp: '00:15', description: '常识vs反常识', intensity: 75 },
  ],
  reversal_points: [
    { timestamp: '00:20', content: '原来爆款视频的核心不是内容而是节奏', impact: 85 },
    { timestamp: '00:35', content: '最后一个技巧让你的完播率提升50%', impact: 95 },
  ],
}

interface LlmAnalysisResult {
  title_analysis: {
    mainTitle: string
    subTitle: string
    keywords: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
  }
  emotional_hooks: Array<{ type: string; strength: number; content: string }>
  conflict_points: Array<{ timestamp: string; description: string; intensity: number }>
  reversal_points: Array<{ timestamp: string; content: string; impact: number }>
}

async function analyzeWithLlm(metadata: Awaited<ReturnType<typeof parseVideoUrl>>): Promise<LlmAnalysisResult> {
  const systemPrompt = `你是一位资深的短视频爆款分析专家。请根据提供的视频元数据，从爆款短视频创作角度进行结构化分析。

请严格按照以下 JSON 格式输出，不要包含任何其他内容：
{
  "title_analysis": {
    "mainTitle": "主标题",
    "subTitle": "副标题",
    "keywords": ["关键词1", "关键词2"],
    "sentiment": "positive" // 或 negative / neutral
  },
  "emotional_hooks": [
    { "type": "curiosity", "strength": 85, "content": "钩子内容描述" }
  ],
  "conflict_points": [
    { "timestamp": "00:05", "description": "冲突点描述", "intensity": 90 }
  ],
  "reversal_points": [
    { "timestamp": "00:20", "content": "反转内容", "impact": 85 }
  ]
}

要求：
- emotional_hooks 至少 2 条，最多 5 条
- conflict_points 至少 2 条
- reversal_points 至少 2 条
- strength / intensity / impact 为 0-100 的整数
- 所有内容使用中文`;

  const userPrompt = `请分析以下视频：
平台：${metadata.platform}
链接：${metadata.originalUrl}
标题：${metadata.title || '未知'}
作者：${metadata.author || '未知'}
描述：${metadata.description || '无'}

请输出 JSON 格式的爆款分析结果。`;

  return chatCompletionJson<LlmAnalysisResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.5, maxTokens: 2048 }
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  // AI 生成类接口使用更严格限流
  if (!applyRateLimit(req, res, 'ai')) return

  const { url, platform } = validateBody(req, videoAnalysisSchema)

  // 如果未配置 LLM，返回演示数据以保持向后兼容
  if (!isLlmConfigured()) {
    const fallback = {
      id: crypto.randomUUID(),
      video_url: url,
      platform,
      status: 'complete',
      ...demoResult,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 尝试写入数据库，失败不阻断返回
    const insertResult = await db.insert('video_analysis', {
      video_url: url,
      platform,
      status: 'complete',
      ...demoResult,
    }, { select: '*', single: true })
    
    if (insertResult.data) return successResponse(res, insertResult.data)

    return successResponse(res, fallback)
  }

  // 1. 先创建 pending 记录（数据库未配置时跳过）
  const pendingResult = await db.insert<{ id: string }>('video_analysis', {
    video_url: url,
    platform,
    status: 'processing',
  }, { select: '*', single: true })
  
  const pendingRecord = pendingResult.data

  try {
    // 2. 解析视频元数据
    const metadata = await parseVideoUrl(url)

    // 3. 调用 LLM 分析
    const analysis = await analyzeWithLlm(metadata)

    const result = {
      id: pendingRecord?.id || crypto.randomUUID(),
      video_url: url,
      platform,
      status: 'complete',
      title_analysis: analysis.title_analysis,
      emotional_hooks: analysis.emotional_hooks,
      conflict_points: analysis.conflict_points,
      reversal_points: analysis.reversal_points,
      raw_metadata: metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 4. 更新记录为完成（数据库未配置时跳过）
    if (pendingRecord) {
      await db.update('video_analysis', {
        status: 'complete',
        title_analysis: analysis.title_analysis,
        emotional_hooks: analysis.emotional_hooks,
        conflict_points: analysis.conflict_points,
        reversal_points: analysis.reversal_points,
        raw_metadata: metadata,
      }, { id: pendingRecord.id })

      // 5. 写入历史记录
      await db.insert('user_history', {
        action_type: 'analysis',
        title: `视频分析：${analysis.title_analysis.mainTitle || metadata.title || '未知视频'}`,
        description: `分析了 ${metadata.platform} 平台的视频结构与情绪钩子`,
        metadata: { analysis_id: pendingRecord.id, url, platform },
      })
    }

    return successResponse(res, result)
  } catch (error) {
    // 更新为错误状态
    if (pendingRecord) {
      await db.update('video_analysis', {
        status: 'error',
        error_message: error instanceof Error ? error.message : '分析失败',
      }, { id: pendingRecord.id })
    }

    throw error
  }
}

export default withErrorHandler(handler)
