// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { chatCompletionJson, isLlmConfigured, getAvailableModels } from '@/lib/llm'
import { parseVideoUrl } from '@/lib/video-parser'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { videoAnalysisSchema } from '@/lib/schemas'
import type { VideoAnalysis } from '@/types'
import { createDatabaseOperation } from '@/lib/database'

const supabase = createAdminClient()
const db = createDatabaseOperation(supabase)

// 简单的字符串哈希函数
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

type DemoResultPool = Partial<VideoAnalysis>

const demoResultPool: DemoResultPool[] = [
  {
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
  },
  {
    platform: 'xiaohongshu',
    status: 'complete',
    title_analysis: {
      mainTitle: '一条笔记涨粉10万，我是怎么做到的？',
      subTitle: '从0到1的小红书爆款笔记创作方法论',
      keywords: ['小红书', '涨粉', '爆款', '笔记', '方法论'],
      sentiment: 'positive',
      targetAudience: '想在小红书快速涨粉的内容创作者',
      painPoint: '认真写笔记却没人看，不知道平台推荐机制',
      valueProposition: '拆解爆款笔记的封面、标题、正文黄金结构',
      suggestedHashtags: ['#小红书运营', '#涨粉技巧', '#内容创作'],
    },
    emotional_hooks: [
      { type: 'curiosity', strength: 90, content: '为什么同样的内容，别人能爆而你不行？', whyItWorks: '直接对比制造焦虑，激发用户一探究竟' },
      { type: 'inspiration', strength: 75, content: '看完这篇，你也能做出爆款笔记', whyItWorks: '给予用户信心和可执行的路径' },
      { type: 'surprise', strength: 65, content: '90%的人不知道，封面比内容重要3倍', whyItWorks: '用数据打破常识，制造认知冲突' },
    ],
    conflict_points: [
      { timestamp: '00:08', description: '封面党vs内容党：到底哪个更重要？', intensity: 80, howToUse: '抛出争议话题，引导评论区讨论' },
      { timestamp: '00:22', description: '标题越长越好vs越短越好：数据告诉你真相', intensity: 70, howToUse: '用数据对比打破二元对立思维' },
    ],
    reversal_points: [
      { timestamp: '00:30', content: '原来爆款笔记的核心不是文笔而是封面', impact: 88, takeaway: '把80%精力放在封面和标题上' },
      { timestamp: '00:45', content: '最后这个技巧让我的互动率翻了3倍', impact: 92, takeaway: '在结尾设置精心设计的互动引导' },
    ],
  },
  {
    platform: 'bilibili',
    status: 'complete',
    title_analysis: {
      mainTitle: 'B站百万播放视频的底层逻辑，一文讲透',
      subTitle: '从选题到剪辑，B站爆款视频全流程拆解',
      keywords: ['B站', '百万播放', '底层逻辑', '选题', '剪辑'],
      sentiment: 'positive',
      targetAudience: '在B站苦苦挣扎的中小UP主',
      painPoint: '视频质量不差但播放量始终上不去',
      valueProposition: '用数据思维拆解B站推荐算法和观众心理',
      suggestedHashtags: ['#B站运营', '#UP主干货', '#视频创作'],
    },
    emotional_hooks: [
      { type: 'curiosity', strength: 88, content: '为什么你花3天做的视频，不如别人1小时随手拍的？', whyItWorks: '用投入产出比的反差引发共鸣' },
      { type: 'frustration', strength: 72, content: 'B站算法又改了？你的播放量为什么一直掉', whyItWorks: '利用创作者对算法变化的焦虑感' },
      { type: 'hope', strength: 68, content: '只要掌握这3个核心指标，播放量翻倍不是梦', whyItWorks: '给出具体可量化的目标，降低焦虑' },
    ],
    conflict_points: [
      { timestamp: '00:12', description: '长视频vs短视频：B站到底偏爱哪种？', intensity: 82, howToUse: '在视频中段抛出现实数据对比，引发讨论' },
      { timestamp: '00:28', description: '标题党该不该做？流量与口碑的博弈', intensity: 76, howToUse: '展示不同策略的利弊，让观众自行判断' },
    ],
    reversal_points: [
      { timestamp: '00:35', content: '原来B站流量密码不是封面，而是开头5秒的完播率', impact: 90, takeaway: '前5秒决定一切，把最精彩的内容放在开头' },
      { timestamp: '00:50', content: '弹幕互动比点赞更重要，这个信号决定了推荐量', impact: 87, takeaway: '在视频中主动设计弹幕触发点' },
    ],
  },
  {
    platform: 'youtube',
    status: 'complete',
    title_analysis: {
      mainTitle: 'YouTube Algorithm Hacks: How I Got 100K Views in 7 Days',
      subTitle: 'A complete breakdown of YouTube SEO, thumbnails, and retention tactics',
      keywords: ['YouTube', 'algorithm', 'SEO', 'thumbnails', 'growth'],
      sentiment: 'positive',
      targetAudience: 'Small YouTube creators struggling to break through the algorithm',
      painPoint: 'Great content but zero views — the YouTube discoverability problem',
      valueProposition: 'Actionable tactics to improve CTR, AVD, and session time',
      suggestedHashtags: ['#YouTubeTips', '#ContentCreator', '#GrowYourChannel'],
    },
    emotional_hooks: [
      { type: 'curiosity', strength: 86, content: 'Why do some mediocre videos get millions of views while yours gets 50?', whyItWorks: 'Taps into the universal frustration of creators' },
      { type: 'surprise', strength: 74, content: 'YouTube cares more about this one metric than any other', whyItWorks: 'Creates information gap that demands resolution' },
      { type: 'hope', strength: 70, content: 'I doubled my views in a week with just 3 small changes', whyItWorks: 'Promises quick wins with minimal effort' },
    ],
    conflict_points: [
      { timestamp: '00:10', description: 'Quality vs Quantity: The endless debate among creators', intensity: 78, howToUse: 'Present both sides with data, let the audience decide' },
      { timestamp: '00:25', description: 'Niche down or go broad? The strategy dilemma', intensity: 72, howToUse: 'Show real examples of both strategies succeeding' },
    ],
    reversal_points: [
      { timestamp: '00:33', content: 'Your best video idea is actually hurting your channel growth', impact: 88, takeaway: 'Focus on audience demand, not personal passion' },
      { timestamp: '00:48', content: 'The thumbnail trick that increased my CTR by 200%', impact: 93, takeaway: 'Test thumbnails before publishing, not after' },
    ],
  },
  {
    platform: 'kuaishou',
    status: 'complete',
    title_analysis: {
      mainTitle: '快手老铁最爱的视频类型，背后全是人性',
      subTitle: '拆解快手生态的独特流量密码和变现逻辑',
      keywords: ['快手', '老铁', '流量密码', '变现', '人性'],
      sentiment: 'positive',
      targetAudience: '想在快手做内容但不知道从何下手的新人',
      painPoint: '不了解快手用户画像，内容方向完全跑偏',
      valueProposition: '从真实快手爆款案例中提取可复用的内容公式',
      suggestedHashtags: ['#快手运营', '#老铁经济', '#短视频变现'],
    },
    emotional_hooks: [
      { type: 'curiosity', strength: 83, content: '为什么快手的带货视频比抖音更赚钱？', whyItWorks: '直接对比两大平台，激发创作者好奇心' },
      { type: 'empathy', strength: 76, content: '月入10万的快手主播，一开始也和你一样迷茫', whyItWorks: '拉近距离，降低心理门槛' },
      { type: 'surprise', strength: 68, content: '快手用户最在意的不是内容质量，而是这一点', whyItWorks: '反常识观点制造认知冲突' },
    ],
    conflict_points: [
      { timestamp: '00:07', description: '人设要不要真实？太真实没人看，太假容易翻车', intensity: 84, howToUse: '用真实案例讨论人设的边界和分寸' },
      { timestamp: '00:18', description: '跟风拍热门vs坚持原创：哪个更有利于长期发展？', intensity: 73, howToUse: '展示不同阶段的不同策略选择' },
    ],
    reversal_points: [
      { timestamp: '00:26', content: '快手的核心竞争力不是内容，而是信任关系', impact: 89, takeaway: '在快手，先交朋友再做内容' },
      { timestamp: '00:40', content: '最后一个变现技巧，让普通创作者也能月入过万', impact: 91, takeaway: '私域流量是快手变现的核心资产' },
    ],
  },
]

function getDemoResult(url: string): DemoResultPool {
  const index = hashString(url) % demoResultPool.length
  return demoResultPool[index]
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

async function analyzeWithLlm(
  metadata: Awaited<ReturnType<typeof parseVideoUrl>>,
  language: 'cn' | 'en',
  model?: string
): Promise<LlmAnalysisResult> {
  const systemPromptCn = `你是一位资深的短视频爆款分析专家与内容策略师。请基于提供的视频元数据（标题、作者、描述），从爆款创作角度进行深度结构化分析，并给出可直接落地执行的复刻建议。

【重要要求】你必须基于实际的视频元数据进行分析，而不是给出泛泛而谈的通用回答。如果视频标题、作者或描述提供了具体信息，请围绕这些具体信息展开分析。

【分析标准】
1. 标题分析：基于实际标题提炼主副标题，分析目标受众、核心痛点、价值主张，并给出 3-5 个相关话题标签。
2. 情绪钩子：每条钩子必须说明"为什么有效"，给出可复用的创作思路，结合视频实际内容。
3. 冲突点：每条冲突点必须给出"如何在同类视频中复用"的具体方法，参考视频实际内容。
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
- 所有内容使用中文，描述具体、有洞察，避免空泛
- 必须参考提供的视频标题、作者、描述等实际元数据进行分析`

  const systemPromptEn = `You are a senior short-video viral-analysis expert and content strategist. Based on the provided video metadata (title, author, description), perform a deep structured analysis from a viral content creation perspective, and provide actionable replication advice.

【IMPORTANT】You MUST base your analysis on the ACTUAL video metadata provided. If the video title, author, or description contains specific information, build your analysis around those specifics. Do NOT produce generic, one-size-fits-all responses.

【Analysis Standards】
1. Title Analysis: Based on the actual title, extract main/sub titles, analyze target audience, core pain points, value proposition, and provide 3-5 relevant hashtags.
2. Emotional Hooks: Each hook must explain "why it works" and provide reusable creative insights tied to the actual video content.
3. Conflict Points: Each conflict point must include specific "how to reuse in similar videos" methods, referencing the actual video content.
4. Reversal Points: Each reversal must extract a key takeaway the audience can walk away with.
5. Content Structure: Break down video segments by timeline, explaining each segment's purpose and core message.
6. Imitation Plan: Provide core creative idea, title formulas, hook templates, content framework, CTA formula, and risk warnings.
7. Scoring & Trends: Provide a 0-100 viral potential score with trend justification.

Output strictly in the following JSON format, nothing else:
{
  "title_analysis": {
    "mainTitle": "Main title",
    "subTitle": "Sub title",
    "keywords": ["keyword1", "keyword2"],
    "sentiment": "positive",
    "targetAudience": "Target audience description",
    "painPoint": "Core pain point",
    "valueProposition": "Value proposition",
    "suggestedHashtags": ["#tag1", "#tag2"]
  },
  "emotional_hooks": [
    { "type": "curiosity", "strength": 85, "content": "Hook content", "whyItWorks": "Why it works" }
  ],
  "conflict_points": [
    { "timestamp": "00:05", "description": "Conflict description", "intensity": 90, "howToUse": "How to reuse" }
  ],
  "reversal_points": [
    { "timestamp": "00:20", "content": "Reversal content", "impact": 85, "takeaway": "Key takeaway for audience" }
  ],
  "content_structure": [
    { "segment": "Opening", "timestamp": "00:00-00:03", "purpose": "Grab attention", "keyPoint": "Core message" }
  ],
  "imitation_plan": {
    "coreIdea": "Core creative idea for replication",
    "titleFormulas": ["Title formula 1", "Title formula 2"],
    "hookTemplates": ["Hook template 1", "Hook template 2"],
    "contentFramework": "Content framework description",
    "ctaFormula": "CTA formula",
    "riskWarnings": ["Risk 1", "Risk 2"]
  },
  "overall_score": 88,
  "trend_potential": "Trend assessment"
}

Requirements:
- emotional_hooks: at least 3, at most 5
- conflict_points: at least 2, at most 4
- reversal_points: at least 2, at most 4
- content_structure: at least 3 segments
- strength / intensity / impact / overall_score: integers 0-100
- All content in English, be specific and insightful, avoid generic statements
- MUST reference the actual video title, author, description, and other metadata in your analysis`

  const systemPrompt = language === 'en' ? systemPromptEn : systemPromptCn

  const title = metadata.title || '未知'
  const author = metadata.author || '未知'
  const description = metadata.description || '无'

  const userPromptCn = `请深度分析以下视频，并提供可直接执行的爆款复刻方案：

平台：${metadata.platform}
链接：${metadata.originalUrl}
标题：${title}
作者：${author}
描述：${description}

请基于以上实际元数据进行分析，输出 JSON 格式的深度分析结果。`

  const userPromptEn = `Please perform a deep analysis of the following video and provide actionable viral replication strategies:

Platform: ${metadata.platform}
URL: ${metadata.originalUrl}
Title: ${title}
Author: ${author}
Description: ${description}

Base your analysis on the actual metadata above. Output the analysis in JSON format.`

  const userPrompt = language === 'en' ? userPromptEn : userPromptCn

  return chatCompletionJson<LlmAnalysisResult>(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.75, maxTokens: 4096, model, language }
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  // AI 生成类接口使用更严格限流
  if (!applyRateLimit(req, res, 'ai')) return

  const { url, platform, model, language } = validateBody(req, videoAnalysisSchema)

  const lang = language as 'cn' | 'en'

  // 如果未配置 LLM，返回演示数据以保持向后兼容
  if (!isLlmConfigured()) {
    const demoResult = getDemoResult(url)

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
    const analysis = await analyzeWithLlm(metadata, lang, model)

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