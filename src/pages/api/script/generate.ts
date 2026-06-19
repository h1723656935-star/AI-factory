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
  vlog: '日常Vlog',
  tutorial: '教程',
  storytelling: '故事讲述',
  debate: '观点辩论',
  challenge: '挑战',
  asmr: '治愈',
  interview: '采访',
  prank: '整蛊',
  transformation: '变装',
  food: '美食',
  tech: '科技',
  fashion: '时尚',
  travel: '旅行',
  fitness: '健身',
  parenting: '育儿',
  finance: '商业财经',
}

const lengthLabels: Record<string, string> = {
  'ultra-short': '7-15秒',
  short: '15-30秒',
  medium: '30-60秒',
  long: '1-3分钟',
  'ultra-long': '3-5分钟',
}

const lengthWordCounts: Record<string, string> = {
  'ultra-short': '80-150字',
  short: '200-350字',
  medium: '400-700字',
  long: '800-1500字',
  'ultra-long': '1500-3000字',
}

const toneOptions: string[] = [
  '轻松', '正式', '幽默', '煽情', '专业', '亲切', '激昂',
  '温柔', '严肃', '调皮', '神秘', '戏精', '冷静', '温暖',
  '犀利', '搞笑', '文艺', '毒舌', '热血', '佛系', '凡尔赛',
]

const demoScript = `标题：这条视频为什么能火？深度拆解爆款密码

【开场】(0-3秒)
大家好！今天给大家带来一个超级搞笑的视频...

【正文】(3-30秒)
首先，我想问问大家，你们有没有遇到过这种情况...

【高潮】(30-45秒)
最搞笑的来了！你们猜发生了什么？哈哈哈...

【结尾】(45-60秒)
哈哈哈，今天的视频就到这里，别忘了点赞关注哦！`

const systemPromptCn = `你是一位短视频脚本策划师。请根据用户给定的主题、风格、语气和时长，创作中文口播脚本。

铁律：
1. 必须紧紧围绕用户指定的主题展开，禁止跑题，禁止写与主题无关的内容。
2. 必须包含：【开场】【正文】【高潮】【结尾】四个部分。
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
旁白：学会了吗？点赞收藏，下次做给家人吃！`

const systemPromptEn = `You are a short video scriptwriter. Create an English video script based on the user's topic, style, tone, and duration.

Strict rules:
1. Stay strictly on the given topic. Do not deviate or write unrelated content.
2. Must include these sections: [Opening] [Body] [Climax] [Ending].
3. Meet the word count requirement. Be specific and informative.
4. [Body] must include at least 3 concrete points or steps tied to the topic.
5. Output the script directly without any explanation or commentary.

Example (Topic: How to make the perfect scrambled eggs):
[Opening]
(Visual: Chef holding fresh eggs and a whisk, smiling)
Narrator: Think you know how to make scrambled eggs? These three tricks will change everything!

[Body]
1. (Visual: Cracking eggs into a cold pan with butter)
   Narrator: First, start with a cold pan and cold butter — low and slow is the secret to creamy eggs.
2. (Visual: Stirring constantly with a silicone spatula)
   Narrator: Second, stir constantly and don't stop. This creates those soft, velvety curds.
3. (Visual: Removing pan from heat while eggs are still slightly runny)
   Narrator: Third, take them off the heat while they're still slightly wet. Carryover cooking will finish them perfectly.

[Climax]
(Visual: Close-up of creamy, fluffy scrambled eggs on toast)
Narrator: Follow these three steps and you'll never eat dry, rubbery eggs again!

[Ending]
(Visual: Chef taking a bite, giving a thumbs up)
Narrator: Try it tomorrow morning and let me know how it goes! Like and subscribe for more!`

async function generateWithLlm(
  topic: string,
  style: string,
  tone: string,
  length: string,
  language: string,
  model?: string,
  analysisContext?: string
): Promise<string> {
  const isEnglish = language === 'en'
  const systemPrompt = isEnglish ? systemPromptEn : systemPromptCn

  const contextBlock = analysisContext
    ? isEnglish
      ? `[Reference Video Analysis]\n${analysisContext}\n\nDraw inspiration from the emotional hooks, conflict structure, and reversal rhythm of the reference video, but do not copy its topic.\n`
      : `【参考视频分析】\n${analysisContext}\n\n请借鉴参考视频的情绪钩子、冲突结构和反转节奏，但不要照搬其主题。\n`
    : ''

  const userPrompt = isEnglish
    ? `${contextBlock}Create a short video script on the topic "${topic}".

Requirements:
- Topic: ${topic}
- Style: ${styleLabels[style] || style}
- Tone: ${tone || 'casual and natural'}
- Duration: ${lengthLabels[length] || '30-60 seconds'}
- Word count: ${lengthWordCounts[length] || '400-700 words'}, must meet the minimum

The entire script must revolve around "${topic}" and provide specific, practical content.`
    : `${contextBlock}请围绕主题 "${topic}" 创作一篇短视频脚本。

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
    { temperature: 0.75, maxTokens: 4096, model, language: language as 'cn' | 'en' }
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { analysisId, topic, style, tone, length, model, language } = validateBody(req, scriptGenerateSchema)

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
    length === 'ultra-short' ? '15秒' : length === 'short' ? '30秒' : length === 'medium' ? '1分钟' : length === 'long' ? '2分钟' : '4分钟'

  // 未配置 LLM 时返回演示脚本
  if (!isLlmConfigured()) {
    const fallback = {
      id: crypto.randomUUID(),
      analysis_id: analysisId || null,
      content: demoScript,
      style,
      tone: tone || '适中',
      length,
      language,
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
  const llmOptions = {
    model: model || undefined,
    language: language || 'cn',
  }
  const scriptContent = await generateWithLlm(
    topic,
    style,
    tone || '轻松',
    length,
    llmOptions.language,
    llmOptions.model,
    analysisContext
  )
  const sceneCount = countScenes(scriptContent)

  const result = {
    id: crypto.randomUUID(),
    analysis_id: analysisId || null,
    content: scriptContent,
    style,
    tone: tone || '轻松',
    length,
    language,
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