// @ts-nocheck
import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, ImageIcon, Wand2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api-client'
import type { Prompt } from '@/types'

const platforms = [
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'stable-diffusion', label: 'Stable Diffusion' },
  { value: 'dalle', label: 'DALL·E' },
  { value: 'leonardo', label: 'Leonardo' },
  { value: 'flux', label: 'Flux' },
  { value: 'jimeng', label: '即梦' },
  { value: 'keling', label: '可灵' },
  { value: 'comfyui', label: 'ComfyUI' },
  { value: 'fooocus', label: 'Fooocus' },
]

const styles = [
  { value: 'cinematic', label: '电影感' },
  { value: 'anime', label: '动漫风' },
  { value: 'realistic', label: '写实' },
  { value: 'minimal', label: '极简' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'vintage', label: '复古' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'noir', label: '暗黑' },
  { value: 'watercolor', label: '水彩' },
  { value: 'oil-painting', label: '油画' },
  { value: '3d-render', label: '3D渲染' },
  { value: 'pixel-art', label: '像素风' },
  { value: 'comic', label: '漫画' },
  { value: 'sketch', label: '素描' },
  { value: 'surreal', label: '超现实' },
  { value: 'gothic', label: '哥特' },
]

const aspectRatios = [
  { value: '1:1', label: '1:1 正方形' },
  { value: '3:2', label: '3:2 横向' },
  { value: '4:3', label: '4:3 横向' },
  { value: '16:9', label: '16:9 宽屏' },
  { value: '2:3', label: '2:3 纵向' },
  { value: '3:4', label: '3:4 纵向' },
  { value: '9:16', label: '9:16 竖屏' },
]

const modelOptions = [
  { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）' },
  { value: 'glm-4-air', label: 'GLM-4-Air' },
  { value: 'glm-4', label: 'GLM-4' },
]

const templates = [
  {
    label: '人物肖像',
    platform: 'midjourney',
    subject: '一位优雅的女性，柔和的自然光，浅景深',
    style: 'realistic',
    details: '35mm镜头，f/1.8光圈，暖色调',
    negativePrompt: '模糊，变形，多余的手指',
    aspectRatio: '3:4',
  },
  {
    label: '赛博朋克城市',
    platform: 'stable-diffusion',
    subject: '未来赛博朋克城市夜景，霓虹灯，飞行汽车',
    style: 'cyberpunk',
    details: '雨夜，全息广告牌，高对比度',
    negativePrompt: '白天，自然光，乡村',
    aspectRatio: '16:9',
  },
  {
    label: '奇幻森林',
    platform: 'midjourney',
    subject: '魔法森林中的精灵村落，发光植物，萤火虫',
    style: 'fantasy',
    details: '晨雾，柔和的魔法光芒，童话氛围',
    negativePrompt: '现代建筑，科技元素',
    aspectRatio: '16:9',
  },
  {
    label: '极简产品',
    platform: 'dalle',
    subject: '白色陶瓷花瓶，极简设计',
    style: 'minimal',
    details: '纯白背景，柔和阴影，商业摄影',
    negativePrompt: '杂乱背景，文字，水印',
    aspectRatio: '1:1',
  },
  {
    label: '动漫角色',
    platform: 'jimeng',
    subject: '二次元少女角色，校服，樱花飘落',
    style: 'anime',
    details: '新海诚风格，柔和光线，高细节',
    negativePrompt: '写实风格，3D渲染',
    aspectRatio: '2:3',
  },
  {
    label: '哥特教堂',
    platform: 'midjourney',
    subject: '宏伟的哥特式大教堂内部，彩色玻璃窗',
    style: 'gothic',
    details: '烛光照明，神秘氛围，建筑细节',
    negativePrompt: '现代元素，明亮光线',
    aspectRatio: '3:4',
  },
]

export default function PromptGeneratorPage() {
  const [platform, setPlatform] = useState('midjourney')
  const [subject, setSubject] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [details, setDetails] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [model, setModel] = useState('glm-4-flash')
  const [language, setLanguage] = useState<'cn' | 'en'>('cn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return

    setLoading(true)
    setError('')
    setPrompt(null)

    try {
      const data = await apiFetch<Prompt>('/api/prompt/generate', {
        method: 'POST',
        body: JSON.stringify({
          platform,
          subject,
          style,
          details: details || undefined,
          negativePrompt: negativePrompt || undefined,
          aspectRatio,
          model,
          language,
        }),
      })
      setPrompt(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提示词生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!prompt?.generated_prompt) return
    await navigator.clipboard.writeText(prompt.generated_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleApplyTemplate = (template: (typeof templates)[number]) => {
    setPlatform(template.platform)
    setSubject(template.subject)
    setStyle(template.style)
    setDetails(template.details)
    setNegativePrompt(template.negativePrompt)
    setAspectRatio(template.aspectRatio)
  }

  return (
    <Layout title="提示词生成" description="AI 一键生成高质量 AI 绘画提示词">
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-sm font-medium mb-4">
              <Wand2 className="w-4 h-4" />
              AI 提示词生成
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              让 AI 帮你写绘画提示词
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              选择平台和风格，输入主题描述，秒级生成专业的 AI 绘画提示词。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="glass-card-dark p-6 border border-gold-500/20">
              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Platform */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">AI 平台</label>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPlatform(p.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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

                {/* Subject */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">主题描述</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="例如：一只戴着墨镜的柴犬在冲浪"
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    required
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">画面风格</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                  >
                    {styles.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    补充细节（可选）
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="光照、构图、画质等补充信息..."
                    rows={2}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none"
                  />
                </div>

                {/* Negative Prompt */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    负面提示词（可选）
                  </label>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="不希望出现在画面中的元素..."
                    rows={2}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none"
                  />
                </div>

                {/* Aspect Ratio + Model + Language */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">画面比例</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                    >
                      {aspectRatios.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">AI 模型</label>
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
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">输出语言</label>
                    <div className="flex rounded-xl overflow-hidden border border-gold-500/20">
                      <button
                        type="button"
                        onClick={() => setLanguage('cn')}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${
                          language === 'cn'
                            ? 'bg-gold-500 text-black'
                            : 'bg-gray-900/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        中文
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-3 text-sm font-medium transition-all ${
                          language === 'en'
                            ? 'bg-gold-500 text-black'
                            : 'bg-gray-900/50 text-gray-400 hover:text-white'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
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
                  {loading ? '生成中...' : '生成提示词'}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Right Column - Result */}
            <div className="glass-card-dark p-6 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-xl font-bold text-white">生成结果</h2>
                {prompt && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                      title="复制"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-gray-900/50 rounded-xl p-4 overflow-auto min-h-[300px]">
                {prompt ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="px-2 py-1 rounded bg-white/5">
                        平台: {platforms.find((p) => p.value === prompt.platform)?.label || prompt.platform}
                      </span>
                      <span className="px-2 py-1 rounded bg-white/5">
                        风格: {styles.find((s) => s.value === prompt.style)?.label || prompt.style}
                      </span>
                      {prompt.aspect_ratio && (
                        <span className="px-2 py-1 rounded bg-white/5">
                          比例: {prompt.aspect_ratio}
                        </span>
                      )}
                      <span className="px-2 py-1 rounded bg-white/5">
                        语言: {language === 'cn' ? '中文' : 'English'}
                      </span>
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {prompt.generated_prompt}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                    <p>左侧填写信息，点击生成按钮</p>
                    <p className="text-sm mt-1">AI 将为你生成专业的绘画提示词</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Templates Section */}
          <div className="mt-10">
            <h2 className="font-orbitron text-xl font-bold text-white mb-4">快速模板</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="glass-card-dark p-4 border border-white/10 rounded-xl text-left hover:border-gold-500/30 transition-all group"
                >
                  <div className="text-gold-500 text-sm font-medium mb-1 group-hover:text-gold-400">
                    {tpl.label}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {tpl.subject}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    {platforms.find((p) => p.value === tpl.platform)?.label} · {styles.find((s) => s.value === tpl.style)?.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}