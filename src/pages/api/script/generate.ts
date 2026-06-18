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
import { scriptGenerateSchema } from '@/lib/schemas'
import { createDatabaseOperation } from '@/lib/database'

const supabase = createAdminClient()
const db = createDatabaseOperation(supabase)

const styleLabels: Record<string, string> = {
  funny: '搞笑',
  emotional: '情感',
  knowledge: '知识',
  suspense: '悬疑',
  inspirational: '励志',
  review: '测评',
}

const lengthLabels: Record<string, string> = {
  short: '15-30秒',
  medium: '30-60秒',
  long: '1-3分钟',
}

const demoScript = `标题：这条视频为什么能火？深度拆解爆款密码

【开场】(0-3秒)
大家好！今天给大家带来一个超级搞笑的视频...

【正文】(3-30秒)
首先，我想问问大家，你们有没有遇到过这种情况...

【高潮】(30-45秒)
最搞笑的来了！你们猜发生了什么？哈哈哈...

【结尾】(45-60秒)
哈哈哈，今天的视频就到这里，别忘了点赞关注哦！`

async function generateWithLlm(
  topic: string,
  style: string,
  tone: string,
  length: string,
  analysisContext?: string
): Promise<string> {
  const systemPrompt = `你是一位专业的短视频脚本策划师。请根据用户提供的主题和要求，创作一篇适合短视频平台的爆款口播脚本。

要求：
- 脚本时长控制在 ${lengthLabels[length] || '30-60秒'}
- 风格为：${styleLabels[style] || '通用'}
- 语气为：${tone || '轻松自然'}
- 结构必须包含：【开场】、【正文】、【高潮】、【结尾】
- 开场要在 3 秒内抓住注意力
- 高潮要有情绪爆发或信息增量
- 结尾要有明确的互动引导（点赞/关注/评论）
- 全部使用中文`;

  const userPrompt = analysisContext
    ? `基于以下视频分析结果，创作一个同款风格的短视频脚本：\n\n${analysisContext}\n\n新主题：${topic}\n风格：${styleLabels[style] || style}\n语气：${tone || '轻松'}\n时长：${lengthLabels[length] || length}`
    : `请为以下主题创作短视频脚本：\n\n主题：${topic}\n风格：${styleLabels[style] || style}\n语气：${tone || '轻松'}\n时长：${lengthLabels[length] || length}`;

  return chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.8, maxTokens: 2048 }
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { analysisId, topic, style, tone, length } = validateBody(req, scriptGenerateSchema)

  // 如果提供了 analysisId，尝试获取视频分析结果作为上下文
  let analysisContext = ''
  if (analysisId) {
    const analysisResult = await db.select<{
      title_analysis: any
      emotional_hooks: any
      conflict_points: any
      reversal_points: any
    }>(
      'video_analysis',
      { id: analysisId },
      { single: true, columns: 'title_analysis, emotional_hooks, conflict_points, reversal_points' }
    )

    if (analysisResult.data) {
      analysisContext = JSON.stringify({
        title: analysisResult.data.title_analysis,
        hooks: analysisResult.data.emotional_hooks,
        conflicts: analysisResult.data.conflict_points,
        reversals: analysisResult.data.reversal_points,
      })
    }
  }

  // 计算场景数（按【】标记）
  const countScenes = (content: string) => Math.max((content.match(/【/g) || []).length, 1)
  const estimatedDuration =
    length === 'short' ? '30秒' : length === 'medium' ? '1分钟' : '2分钟'

  // 未配置 LLM 时返回演示脚本
  if (!isLlmConfigured()) {
    const fallback = {
      id: crypto.randomUUID(),
      analysis_id: analysisId || null,
      content: demoScript,
      style,
      tone: tone || '适中',
      length,
      scene_count: 4,
      estimated_duration: estimatedDuration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const insertResult = await db.insert('scripts', {
      analysis_id: analysisId || null,
      content: demoScript,
      style,
      tone: tone || '适中',
      length,
      scene_count: 4,
      estimated_duration: estimatedDuration,
    }, { select: '*', single: true })
    
    if (insertResult.data) return successResponse(res, insertResult.data)

    return successResponse(res, fallback)
  }

  // 调用 LLM 生成脚本
  const scriptContent = await generateWithLlm(topic, style, tone || '轻松', length, analysisContext)
  const sceneCount = countScenes(scriptContent)

  const result = {
    id: crypto.randomUUID(),
    analysis_id: analysisId || null,
    content: scriptContent,
    style,
    tone: tone || '轻松',
    length,
    scene_count: sceneCount,
    estimated_duration: estimatedDuration,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // 尝试写入数据库
  const insertResult = await db.insert<{ id: string }>('scripts', result, { select: '*', single: true })
  
  if (insertResult.data) {
    await db.insert('user_history', {
      action_type: 'script',
      title: `脚本生成：${topic}`,
      description: `生成了 ${lengthLabels[length]} 的 ${styleLabels[style]} 风格脚本`,
      metadata: { script_id: insertResult.data.id, topic, style, length },
    })
    return successResponse(res, insertResult.data)
  }

  return successResponse(res, result)
}

export default withErrorHandler(handler)
