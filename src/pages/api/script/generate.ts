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

const lengthWordCounts: Record<string, string> = {
  short: '200-350字',
  medium: '400-700字',
  long: '800-1500字',
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
  const systemPrompt = `你是一位短视频脚本策划师。请根据用户给定的主题、风格、语气和时长，创作中文口播脚本。

铁律：
1. 必须紧紧围绕用户指定的主题展开，禁止跑题，禁止写与主题无关的内容。
2. 必须包含：【开场】【正文】【高潮】【结尾】。
3. 字数必须达到要求下限，内容具体、有信息增量。
4. 【正文】至少给出 3 个紧扣主题的具体信息点或步骤。
5. 直接输出脚本正文，不要解释。

示例（主题：如何做番茄炒蛋）：
【开场】
（画面：主角拿着两个鸡蛋和一个番茄，表情神秘）
旁白：你以为番茄炒蛋人人都会？其实想做出嫩滑入味的版本，关键就在这三步！

【正文】
1. （画面：番茄划十字，开水烫后去皮）
   旁白：第一，番茄一定要去皮，口感才会细腻，汤汁也更浓郁。
2. （画面：鸡蛋加少许水淀粉打散）
   旁白：第二，蛋液里加一勺水淀粉，炒出来更蓬松嫩滑。
3. （画面：先炒番茄出汁，再倒入鸡蛋）
   旁白：第三，先炒番茄炒出沙，再倒入鸡蛋，让每块蛋都裹满茄汁。

【高潮】
（画面：成品特写，汤汁浓郁）
旁白：记住这三步，家常番茄炒蛋也能做出餐厅级口感！

【结尾】
（画面：主角端着盘子笑）
旁白：学会了吗？点赞收藏，下次做给家人吃！`;

  const contextBlock = analysisContext
    ? `【参考视频分析】\n${analysisContext}\n\n请借鉴参考视频的情绪钩子、冲突结构和反转节奏，但不要照搬其主题。\n`
    : '';

  const userPrompt = `${contextBlock}请围绕主题 "${topic}" 创作一篇短视频脚本。

要求：
- 主题：${topic}
- 风格：${styleLabels[style] || style}
- 语气：${tone || '轻松自然'}
- 时长：${lengthLabels[length] || '30-60秒'}
- 字数：${lengthWordCounts[length] || '400-700字'}，必须达到下限

整篇脚本必须围绕 "${topic}"，提供具体、实用的内容。`

  return chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.6, maxTokens: 4096 }
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
