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
    targetAudience: '想做短视频但缺乏方向的新手创作者',
    painPoint: '辛苦拍的视频没人看，不知道爆款底层逻辑',
    valueProposition: '用一条视频讲清楚爆款视频的钩子、冲突和反转结构',
    suggestedHashtags: ['#短视频运营', '#爆款文案', '#自媒体干货'],
  },
  emotional_hooks: [
    { type: 'curiosity', strength: 85, content: '你知道为什么别人的视频能上热门吗？', whyItWorks: '直接点名用户痛点，激发求知欲' },
    { type: 'surprise', strength: 70, content: '这条视频只用了3秒就抓住了观众注意力', whyItWorks: '用具体数字制造反差，引发好奇' },
    { type: 'joy', strength: 60, content: '看完这个技巧，你会发现原来这么简单', whyItWorks: '降低用户心理门槛，传递可落地的希望' },
  ],
  conflict_points: [
    { timestamp: '00:05', description: '观众期待vs现实反差：你以为拍视频靠运气，其实靠结构', intensity: 90, howToUse: '在开场抛出反常识观点，打破观众认知' },
    { timestamp: '00:15', description: '常识vs反常识：内容好不一定火，节奏好才容易火', intensity: 75, howToUse: '用对比制造争议，提升评论率' },
  ],
  reversal_points: [
    { timestamp: '00:20', content: '原来爆款视频的核心不是内容而是节奏', impact: 85, takeaway: '创作者应先学习节奏控制，再追求内容深度' },
    { timestamp: '00:35', content: '最后一个技巧让你的完播率提升50%', impact: 95, takeaway: '在结尾给出高价值承诺，驱动看完和互动' },
  ],
}

interface LlmAnalysisResult {
  title_analysis: {
    mainTitle: string
    subTitle: string
    keywords: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    targetAudience: string
    painPoint: string
    valueProposition: string
    suggestedHashtags: string[]
  }
  emotional_hooks: Array<{ type: string; strength: number; content: string; whyItWorks: string }>
  conflict_points: Array<{ timestamp: string; description: string; intensity: number; howToUse: string }>
  reversal_points: Array<{ timestamp: string; content: string; impact: number; takeaway: string }>
  content_structure: Array<{ segment: string; timestamp: string; purpose: string; keyPoint: string }>
  imitation_plan: {
    coreIdea: string
    titleFormulas: string[]
    hookTemplates: string[]
    contentFramework: string
    ctaFormula: string
    riskWarnings: string[]
  }
  overall_score: number
  trend_potential: string
}

async function analyzeWithLlm(metadata: Awaited<ReturnType<typeof parseVideoUrl>>): Promise<LlmAnalysisResult> {
  const systemPrompt = `你是一位资深的短视频爆款分析专家与内容策略师。请基于提供的视频元数据，从爆款创作角度进行深度结构化分析，并给出可直接落地执行的复刻建议。

【分析标准】
1. 标题分析：不仅提炼主副标题，还要分析目标受众、核心痛点、价值主张，并给出 3-5 个相关话题标签。
2. 情绪钩子：每条钩子必须说明"为什么有效"，给出可复用的创作思路。
3. 冲突点：每条冲突点必须给出"如何在同类视频中复用"的具体方法。
4. 反转点：每条反转点必须提炼出"观众能带走什么"的关键认知。
5. 内容结构：按时间线梳理视频片段，说明每个片段的目的和核心信息。
6. 复刻方案：提供核心创意、标题公式、钩子模板、内容框架、CTA公式和风险提示。
7. 评分与趋势：给出 0-100 的爆款潜力评分，并说明趋势判断。

请严格按照以下 JSON 格式输出，不要包含任何其他内容：
{
  "title_analysis": {
    "mainTitle": "主标题",
    "subTitle": "副标题",
    "keywords": ["关键词1", "关键词2"],
    "sentiment": "positive",
    "targetAudience": "目标受众描述",
    "painPoint": "核心痛点",
    "valueProposition": "价值主张",
    "suggestedHashtags": ["#标签1", "#标签2"]
  },
  "emotional_hooks": [
    { "type": "curiosity", "strength": 85, "content": "钩子内容", "whyItWorks": "有效原因" }
  ],
  "conflict_points": [
    { "timestamp": "00:05", "description": "冲突点描述", "intensity": 90, "howToUse": "复用方法" }
  ],
  "reversal_points": [
    { "timestamp": "00:20", "content": "反转内容", "impact": 85, "takeaway": "观众带走的关键认知" }
  ],
  "content_structure": [
    { "segment": "开场", "timestamp": "00:00-00:03", "purpose": "抓注意力", "keyPoint": "核心信息" }
  ],
  "imitation_plan": {
    "coreIdea": "复刻核心创意",
    "titleFormulas": ["标题公式1", "标题公式2"],
    "hookTemplates": ["钩子模板1", "钩子模板2"],
    "contentFramework": "内容框架说明",
    "ctaFormula": "互动引导公式",
    "riskWarnings": ["风险1", "风险2"]
  },
  "overall_score": 88,
  "trend_potential": "趋势判断说明"
}

要求：
- emotional_hooks 至少 3 条，最多 5 条
- conflict_points 至少 2 条，最多 4 条
- reversal_points 至少 2 条，最多 4 条
- content_structure 至少 3 段
- strength / intensity / impact / overall_score 为 0-100 的整数
- 所有内容使用中文，描述具体、有洞察，避免空泛`;

  const userPrompt = `请深度分析以下视频，并提供可直接执行的爆款复刻方案：

平台：${metadata.platform}
链接：${metadata.originalUrl}
标题：${metadata.title || '未知'}
作者：${metadata.author || '未知'}
描述：${metadata.description || '无'}

请输出 JSON 格式的深度分析结果。`;

  return chatCompletionJson<LlmAnalysisResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.5, maxTokens: 4096 }
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

    const enrichment = {
      content_structure: analysis.content_structure,
      imitation_plan: analysis.imitation_plan,
      overall_score: analysis.overall_score,
      trend_potential: analysis.trend_potential,
    }

    const result = {
      id: pendingRecord?.id || crypto.randomUUID(),
      video_url: url,
      platform,
      status: 'complete',
      title_analysis: analysis.title_analysis,
      emotional_hooks: analysis.emotional_hooks,
      conflict_points: analysis.conflict_points,
      reversal_points: analysis.reversal_points,
      raw_metadata: { ...metadata, ...enrichment },
      ...enrichment,
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
        raw_metadata: { ...metadata, ...enrichment },
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
