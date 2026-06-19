// @ts-nocheck
import { useState, useRef } from 'react'
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Download,
  ChevronDown,
  Globe,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api-client'

// --------------- 常量定义 ---------------

const primaryStyles = [
  { value: 'funny', label: '😂搞笑' },
  { value: 'emotional', label: '🥺情感' },
  { value: 'knowledge', label: '📚知识' },
  { value: 'suspense', label: '🎭悬疑' },
  { value: 'food', label: '🍳美食' },
  { value: 'tutorial', label: '📖教程' },
]

const moreStyles = [
  { value: 'vlog', label: '📹日常Vlog' },
  { value: 'storytelling', label: '📝故事讲述' },
  { value: 'debate', label: '💬观点辩论' },
  { value: 'challenge', label: '🏆挑战' },
  { value: 'asmr', label: '🧘治愈' },
  { value: 'interview', label: '🎤采访' },
  { value: 'prank', label: '🤪整蛊' },
  { value: 'transformation', label: '✨变装' },
  { value: 'tech', label: '💻科技' },
  { value: 'fashion', label: '👗时尚' },
  { value: 'travel', label: '✈️旅行' },
  { value: 'fitness', label: '💪健身' },
  { value: 'parenting', label: '👶育儿' },
  { value: 'finance', label: '💰商业财经' },
  { value: 'inspirational', label: '🌟励志' },
  { value: 'review', label: '📦测评' },
]

const toneOptions = [
  '轻松', '正式', '幽默', '煽情', '专业', '亲切', '激昂',
  '温柔', '严肃', '调皮', '神秘', '戏精', '冷静', '温暖',
  '犀利', '搞笑', '文艺', '毒舌', '热血', '佛系', '凡尔赛',
]

const lengthOptions = [
  { value: 'ultra-short', label: '7-15秒' },
  { value: 'short', label: '15-30秒' },
  { value: 'medium', label: '30-60秒' },
  { value: 'long', label: '1-3分钟' },
  { value: 'ultra-long', label: '3-5分钟' },
]

const modelOptions = [
  { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）' },
  { value: 'glm-4-air', label: 'GLM-4-Air' },
  { value: 'glm-4', label: 'GLM-4' },
]

// --------------- 组件 ---------------

export default function ScriptGeneratorPage() {
  const { user } = useAuth()

  // 表单状态
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('funny')
  const [tone, setTone] = useState('轻松')
  const [length, setLength] = useState('medium')
  const [model, setModel] = useState('glm-4-flash')
  const [language, setLanguage] = useState<'cn' | 'en'>('cn')

  // UI 状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    content: string
    style: string
    tone: string
    length: string
    scene_count?: number
    estimated_duration?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [moreStylesOpen, setMoreStylesOpen] = useState(false)

  const moreStylesRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭"更多风格"下拉
  const handleBlur = (e: React.FocusEvent) => {
    if (moreStylesRef.current && !moreStylesRef.current.contains(e.relatedTarget as Node)) {
      setMoreStylesOpen(false)
    }
  }

  const allStyles = [...primaryStyles, ...moreStyles]

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await apiFetch<{
        content: string
        style: string
        tone: string
        length: string
        scene_count?: number
        estimated_duration?: string
      }>('/api/script/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          style,
          tone,
          length,
          model,
          language,
        }),
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '脚本生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.content) return
    await navigator.clipboard.writeText(result.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result?.content) return
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script-${topic.slice(0, 20) || 'generated'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const currentStyleLabel = allStyles.find((s) => s.value === style)?.label || style
  const currentLengthLabel = lengthOptions.find((l) => l.value === length)?.label || length

  return (
    <Layout title="脚本生成" description="AI 生成短视频口播脚本，支持多种风格和语气">
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题区 */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              AI 脚本工具
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              一键生成爆款短视频脚本
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              选择风格、语气和时长，AI 为你创作高质量口播脚本。
            </p>
          </div>

          {/* 主体：左侧表单 + 右侧结果 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ===== 左侧面板 (lg:col-span-1) ===== */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card-dark p-6 border border-gold-500/20">
                <form onSubmit={handleGenerate} className="space-y-5">
                  {/* 语言切换 */}
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 text-sm font-medium">脚本语言</label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setLanguage('cn')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          language === 'cn'
                            ? 'bg-gold-500 text-black'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Globe className="w-3 h-3 inline mr-1" />
                        中文
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          language === 'en'
                            ? 'bg-gold-500 text-black'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Globe className="w-3 h-3 inline mr-1" />
                        English
                      </button>
                    </div>
                  </div>

                  {/* 主题 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      视频主题
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="输入你想创作的主题，如：如何做番茄炒蛋"
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                      required
                    />
                  </div>

                  {/* 风格选择 - 主网格 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      视频风格
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {primaryStyles.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStyle(s.value)}
                          className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                            style === s.value
                              ? 'bg-gold-500 text-black'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* 更多风格下拉 */}
                    <div
                      ref={moreStylesRef}
                      className="relative"
                      onBlur={handleBlur}
                    >
                      <button
                        type="button"
                        onClick={() => setMoreStylesOpen(!moreStylesOpen)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                          !primaryStyles.some((s) => s.value === style)
                            ? 'bg-gold-500/20 border border-gold-500/50 text-gold-500'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span>
                          {!primaryStyles.some((s) => s.value === style)
                            ? currentStyleLabel
                            : '更多风格'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            moreStylesOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {moreStylesOpen && (
                        <div className="absolute z-20 mt-1 w-full bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                          <div className="grid grid-cols-2 gap-1 p-2 max-h-56 overflow-y-auto">
                            {moreStyles.map((s) => (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => {
                                  setStyle(s.value)
                                  setMoreStylesOpen(false)
                                }}
                                className={`px-2 py-2 rounded-lg text-xs text-left transition-all ${
                                  style === s.value
                                    ? 'bg-gold-500/20 text-gold-500'
                                    : 'text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 语气 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      语气
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                    >
                      {toneOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 时长 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      时长
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {lengthOptions.map((l) => (
                        <button
                          key={l.value}
                          type="button"
                          onClick={() => setLength(l.value)}
                          className={`px-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            length === l.value
                              ? 'bg-gold-500 text-black'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 模型 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      模型
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                    >
                      {modelOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 生成按钮 */}
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
                    {loading ? '生成中...' : '生成脚本'}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* ===== 右侧面板 (lg:col-span-2) ===== */}
            <div className="lg:col-span-2">
              <div className="glass-card-dark p-6 border border-white/10 flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-orbitron text-xl font-bold text-white">
                    生成结果
                  </h2>
                  {result && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                        title="复制"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                        title="下载"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-gray-900/50 rounded-xl p-4 overflow-auto min-h-[400px]">
                  {result ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                        <span className="px-2 py-1 rounded bg-white/5">
                          风格: {currentStyleLabel}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/5">
                          语气: {result.tone || tone}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/5">
                          时长: {result.estimated_duration || currentLengthLabel}
                        </span>
                        {result.scene_count != null && (
                          <span className="px-2 py-1 rounded bg-white/5">
                            场景数: {result.scene_count}
                          </span>
                        )}
                      </div>
                      <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {result.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <FileText className="w-12 h-12 mb-3 opacity-30" />
                      <p>左侧输入主题，选择风格和语气</p>
                      <p className="text-sm mt-1">AI 将为你生成专业短视频脚本</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}