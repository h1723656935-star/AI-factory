import { useState } from 'react'
import { Wand2, Sparkles, Copy, Check, RefreshCw, Image as ImageIcon } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

const platforms = [
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'stable-diffusion', label: 'Stable Diffusion' },
  { value: 'dalle', label: 'DALL·E' },
  { value: 'leonardo', label: 'Leonardo' },
]

const styles = [
  { value: 'cinematic', label: '电影感' },
  { value: 'anime', label: '动漫风' },
  { value: 'realistic', label: '写实' },
  { value: 'minimal', label: '极简' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'vintage', label: '复古' },
]

const aspectRatios = [
  { value: '16:9', label: '16:9 横屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '1:1', label: '1:1 方形' },
  { value: '4:3', label: '4:3 横屏' },
]

const templates = [
  { name: '爆款封面', prompt: 'viral short video thumbnail, eye-catching title, dramatic lighting, high contrast' },
  { name: '产品展示', prompt: 'product showcase, clean background, professional lighting, premium quality' },
  { name: '人物特写', prompt: 'portrait close-up, soft lighting, expressive face, cinematic bokeh' },
  { name: '科技风', prompt: 'futuristic tech scene, neon lights, holographic interface, dark background' },
]

export default function PromptGeneratorPage() {
  const [platform, setPlatform] = useState('midjourney')
  const [subject, setSubject] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [details, setDetails] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [loading, setLoading] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return

    setLoading(true)
    setGeneratedPrompt('')

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const ratioText = aspectRatio.replace(':', ' by ')
    const prompt = `${subject}, ${style} style, ${details || 'high quality, detailed'}, cinematic lighting, ${ratioText}${
      platform === 'midjourney' ? ', 8k, ultra detailed --ar ' + aspectRatio : ''
    }${negativePrompt ? ` --no ${negativePrompt}` : ''}`

    setGeneratedPrompt(prompt)
    setLoading(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyTemplate = (template: typeof templates[0]) => {
    setSubject(template.prompt)
  }

  return (
    <Layout title="提示词生成" description="AI 生成 Midjourney、Stable Diffusion 等专业绘图提示词">
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-sm font-medium mb-4">
              <Wand2 className="w-4 h-4" />
              AI 提示词工具
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              一键生成专业 AI 绘图提示词
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              为 Midjourney、Stable Diffusion 等工具生成高质量视觉提示词。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="glass-card-dark p-6 border border-gold-500/20">
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">平台</label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                      >
                        {platforms.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">风格</label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                      >
                        {styles.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">主体描述</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="例如：赛博朋克风格的短视频创作者"
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">补充细节</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="例如：金色霓虹灯、雨夜街道、未来感十足"
                      rows={3}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">负面提示词</label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="例如：blurry, low quality, distorted"
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">画面比例</label>
                    <div className="grid grid-cols-4 gap-2">
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.value}
                          type="button"
                          onClick={() => setAspectRatio(ratio.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            aspectRatio === ratio.value
                              ? 'bg-gold-500 text-black'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

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
              </div>

              <div className="glass-card-dark p-6 border border-white/10">
                <h3 className="font-orbitron text-lg font-bold text-white mb-4">快速模板</h3>
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      className="p-3 rounded-xl bg-white/5 text-left text-sm text-gray-300 hover:bg-gold-500/10 hover:text-gold-500 transition-all"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card-dark p-6 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-xl font-bold text-white">生成结果</h2>
                {generatedPrompt && (
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                )}
              </div>

              <div className="flex-1 bg-gray-900/50 rounded-xl p-4 overflow-auto min-h-[300px]">
                {generatedPrompt ? (
                  <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {generatedPrompt}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                    <p>左侧输入描述，点击生成按钮</p>
                    <p className="text-sm mt-1">AI 将为你生成专业绘图提示词</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
