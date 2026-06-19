import { useState } from 'react'
import {
  Play,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Zap,
  Flame,
  TrendingUp,
  Target,
  Lightbulb,
  BookOpen,
  Star,
  AlertTriangle,
  Clock,
  BarChart3,
  Hash,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api-client'
import type { VideoAnalysis, EmotionalHook, ConflictPoint, ReversalPoint } from '@/types'

const platformOptions = [
  { value: 'douyin', label: '抖音' },
  { value: 'kuaishou', label: '快手' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'bilibili', label: 'B站' },
  { value: 'youtube', label: 'YouTube' },
]

const modelOptions = [
  { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）' },
  { value: 'glm-4-air', label: 'GLM-4-Air' },
  { value: 'glm-4', label: 'GLM-4' },
]

const hookTypeLabels: Record<string, string> = {
  curiosity: '好奇心',
  surprise: '惊喜',
  joy: '快乐',
  inspiration: '激励',
  empathy: '共情',
  frustration: '焦虑',
  hope: '希望',
  fear: '恐惧',
  anger: '愤怒',
  sadness: '悲伤',
}

const hookTypeColors: Record<string, string> = {
  curiosity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  surprise: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  joy: 'bg-green-500/10 text-green-400 border-green-500/20',
  inspiration: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  empathy: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  frustration: 'bg-red-500/10 text-red-400 border-red-500/20',
  hope: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  fear: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  anger: 'bg-red-500/10 text-red-400 border-red-500/20',
  sadness: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

export default function VideoAnalysisPage() {
  const { user } = useAuth()

  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('douyin')
  const [model, setModel] = useState('glm-4-flash')
  const [language, setLanguage] = useState<'cn' | 'en'>('cn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VideoAnalysis | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await apiFetch<VideoAnalysis>('/api/analysis/video', {
        method: 'POST',
        body: JSON.stringify({ url, platform, model, language }),
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20'
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '爆款潜力'
    if (score >= 60) return '良好'
    return '一般'
  }

  return (
    <Layout title="视频分析" description="输入视频链接，获取深度分析报告">
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题区 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              AI 视频分析
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              深度拆解爆款视频密码
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              输入任意短视频链接，AI 自动分析钩子、冲突、反转结构，并提供可落地的复刻方案。
            </p>
          </div>

          {/* 表单区域 */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="glass-card-dark p-6 border border-gold-500/20">
              <form onSubmit={handleAnalyze} className="space-y-5">
                {/* 平台选择 */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">平台</label>
                  <div className="flex flex-wrap gap-2">
                    {platformOptions.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          platform === p.value
                            ? 'bg-gold-500 text-black'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 视频链接 */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">视频链接</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="粘贴抖音/快手/B站/小红书/YouTube 视频分享链接..."
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    required
                  />
                </div>

                {/* 模型 & 语言 */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm font-medium">模型</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="bg-gray-900/50 border border-gold-500/20 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-500/50 transition-all"
                    >
                      {modelOptions.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm font-medium">语言</label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setLanguage('cn')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          language === 'cn' ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Globe className="w-3 h-3 inline mr-1" />中文
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          language === 'en' ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Globe className="w-3 h-3 inline mr-1" />English
                      </button>
                    </div>
                  </div>
                </div>

                {/* 分析按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {loading ? '分析中...' : '开始分析'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-10 h-10 text-gold-500 animate-spin mb-4" />
              <p className="text-gray-400">正在深度分析视频内容，请稍候...</p>
            </div>
          )}

          {/* 分析结果 */}
          {result && !loading && (
            <div className="space-y-6">
              {/* 评分与趋势 */}
              <div className="glass-card-dark p-6 border border-white/10">
                <div className="flex flex-wrap items-center gap-4">
                  {result.overall_score != null && (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${getScoreBg(result.overall_score)}`}>
                      <BarChart3 className="w-5 h-5" />
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(result.overall_score)}`}>
                          {result.overall_score}分
                        </div>
                        <div className="text-xs text-gray-400">{getScoreLabel(result.overall_score)}</div>
                      </div>
                    </div>
                  )}
                  {result.trend_potential && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-cyan-500/10 border-cyan-500/20">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-sm font-medium text-cyan-400">趋势判断</div>
                        <div className="text-xs text-gray-400">{result.trend_potential}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 标题分析 */}
              {result.title_analysis && (
                <div className="glass-card-dark p-6 border border-white/10">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-gold-500" />
                    标题分析
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">主标题</p>
                      <p className="text-white text-lg font-medium">{result.title_analysis.mainTitle}</p>
                    </div>
                    {result.title_analysis.subTitle && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">副标题</p>
                        <p className="text-gray-300">{result.title_analysis.subTitle}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.title_analysis.targetAudience && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">目标受众</p>
                          <p className="text-gray-300 text-sm">{result.title_analysis.targetAudience}</p>
                        </div>
                      )}
                      {result.title_analysis.painPoint && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">核心痛点</p>
                          <p className="text-gray-300 text-sm">{result.title_analysis.painPoint}</p>
                        </div>
                      )}
                      {result.title_analysis.valueProposition && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">价值主张</p>
                          <p className="text-gray-300 text-sm">{result.title_analysis.valueProposition}</p>
                        </div>
                      )}
                      {result.title_analysis.sentiment && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">情绪倾向</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.title_analysis.sentiment === 'positive' ? 'bg-green-500/10 text-green-400' :
                            result.title_analysis.sentiment === 'negative' ? 'bg-red-500/10 text-red-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {result.title_analysis.sentiment === 'positive' ? '正面' :
                             result.title_analysis.sentiment === 'negative' ? '负面' : '中性'}
                          </span>
                        </div>
                      )}
                    </div>
                    {result.title_analysis.keywords && result.title_analysis.keywords.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">关键词</p>
                        <div className="flex flex-wrap gap-2">
                          {result.title_analysis.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-gray-300 text-xs">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.title_analysis.suggestedHashtags && result.title_analysis.suggestedHashtags.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">推荐标签</p>
                        <div className="flex flex-wrap gap-2">
                          {result.title_analysis.suggestedHashtags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-gold-500/10 text-gold-400 text-xs border border-gold-500/20">
                              <Hash className="w-3 h-3 inline mr-0.5" />{tag.replace('#', '')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 情绪钩子 */}
              {result.emotional_hooks && result.emotional_hooks.length > 0 && (
                <div className="glass-card-dark p-6 border border-white/10">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    情绪钩子
                  </h2>
                  <div className="space-y-3">
                    {result.emotional_hooks.map((hook: EmotionalHook, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-gold-500/20 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="text-white font-medium">{hook.content}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${hookTypeColors[hook.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                              {hookTypeLabels[hook.type] || hook.type}
                            </span>
                            <span className="text-xs text-gray-500">强度 {hook.strength}%</span>
                          </div>
                        </div>
                        {hook.whyItWorks && (
                          <p className="text-sm text-gray-400 mt-1">
                            <Lightbulb className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                            为什么有效：{hook.whyItWorks}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 冲突点 */}
              {result.conflict_points && result.conflict_points.length > 0 && (
                <div className="glass-card-dark p-6 border border-white/10">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    冲突点
                  </h2>
                  <div className="space-y-3">
                    {result.conflict_points.map((cp: ConflictPoint, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs font-mono">
                            {cp.timestamp}
                          </span>
                          <span className="text-xs text-gray-500">冲突强度 {cp.intensity}%</span>
                        </div>
                        <p className="text-white font-medium mb-2">{cp.description}</p>
                        {cp.howToUse && (
                          <p className="text-sm text-gray-400">
                            <ChevronRight className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                            复用方法：{cp.howToUse}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 反转点 */}
              {result.reversal_points && result.reversal_points.length > 0 && (
                <div className="glass-card-dark p-6 border border-white/10">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    反转点
                  </h2>
                  <div className="space-y-3">
                    {result.reversal_points.map((rp: ReversalPoint, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-mono">
                            {rp.timestamp}
                          </span>
                          <span className="text-xs text-gray-500">影响力 {rp.impact}%</span>
                        </div>
                        <p className="text-white font-medium mb-2">{rp.content}</p>
                        {rp.takeaway && (
                          <p className="text-sm text-gray-400">
                            <Star className="w-3.5 h-3.5 inline mr-1 text-gold-500" />
                            核心认知：{rp.takeaway}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 内容结构 */}
              {result.content_structure && result.content_structure.length > 0 && (
                <div className="glass-card-dark p-6 border border-white/10">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    内容结构
                  </h2>
                  <div className="space-y-3">
                    {result.content_structure.map((segment, idx: number) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="shrink-0 w-20 text-center">
                          <span className="block text-xs font-mono text-gold-500">{segment.timestamp}</span>
                          <span className="block text-xs text-gray-500 mt-1">{segment.purpose}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{segment.segment}</p>
                          <p className="text-gray-400 text-sm mt-1">{segment.keyPoint}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 复刻方案 */}
              {result.imitation_plan && (
                <div className="glass-card-dark p-6 border border-gold-500/20">
                  <h2 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    复刻方案
                  </h2>
                  <div className="space-y-4">
                    {result.imitation_plan.coreIdea && (
                      <div className="p-4 rounded-xl bg-gold-500/5 border border-gold-500/10">
                        <p className="text-sm text-gray-400 mb-1">核心创意</p>
                        <p className="text-white">{result.imitation_plan.coreIdea}</p>
                      </div>
                    )}
                    {result.imitation_plan.titleFormulas && result.imitation_plan.titleFormulas.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">标题公式</p>
                        <div className="space-y-2">
                          {result.imitation_plan.titleFormulas.map((formula: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                              <span className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-500 text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-gray-300 text-sm">{formula}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.imitation_plan.hookTemplates && result.imitation_plan.hookTemplates.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">钩子模板</p>
                        <div className="space-y-2">
                          {result.imitation_plan.hookTemplates.map((template: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                              <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <p className="text-gray-300 text-sm">{template}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.imitation_plan.contentFramework && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">内容框架</p>
                        <p className="text-gray-300 text-sm p-3 rounded-xl bg-white/5">{result.imitation_plan.contentFramework}</p>
                      </div>
                    )}
                    {result.imitation_plan.ctaFormula && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">CTA 公式</p>
                        <p className="text-gray-300 text-sm p-3 rounded-xl bg-white/5">{result.imitation_plan.ctaFormula}</p>
                      </div>
                    )}
                    {result.imitation_plan.riskWarnings && result.imitation_plan.riskWarnings.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          风险提示
                        </p>
                        <div className="space-y-2">
                          {result.imitation_plan.riskWarnings.map((risk: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/5">
                              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                              <p className="text-yellow-300/80 text-sm">{risk}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 底部操作 */}
              <div className="flex justify-center gap-4 pt-4">
                <a
                  href={`/script-generator`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-500 hover:bg-gold-500/20 transition-all text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  用此分析生成脚本
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}