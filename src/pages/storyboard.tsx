import { useState } from 'react'
import { Image as ImageIcon, Sparkles, RefreshCw, Clock, Wand2, Copy, Check } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api-client'
import type { Storyboard, StoryboardFrame } from '@/types'

const styles = [
  { value: 'cinematic', label: '电影感' },
  { value: 'anime', label: '动漫风' },
  { value: 'realistic', label: '写实' },
  { value: 'minimal', label: '极简' },
  { value: 'vintage', label: '复古' },
  { value: 'cyberpunk', label: '赛博朋克' },
]

const demoFrames: StoryboardFrame[] = [
  {
    id: '1',
    sceneNumber: 1,
    description: '开场镜头：主角站在城市天台，逆光剪影',
    visualPrompt: 'A silhouette of a creator standing on a city rooftop at golden hour, cinematic lighting, wide angle, 8k',
    duration: '3秒',
  },
  {
    id: '2',
    sceneNumber: 2,
    description: '特写：手机屏幕亮起，显示爆款数据',
    visualPrompt: 'Close-up of a smartphone screen showing viral analytics numbers, glowing interface, shallow depth of field',
    duration: '5秒',
  },
  {
    id: '3',
    sceneNumber: 3,
    description: '中景：主角兴奋地握拳',
    visualPrompt: 'Medium shot of an excited creator fist pumping, neon city lights in background, cyberpunk aesthetic',
    duration: '5秒',
  },
  {
    id: '4',
    sceneNumber: 4,
    description: '转场：快速剪辑多个爆款画面',
    visualPrompt: 'Fast montage of viral video thumbnails floating in digital space, holographic, futuristic',
    duration: '5秒',
  },
  {
    id: '5',
    sceneNumber: 5,
    description: '结尾：主角面对镜头微笑，出现 logo',
    visualPrompt: 'Creator smiling confidently at camera, gold and black color scheme, logo reveal, professional studio lighting',
    duration: '5秒',
  },
]

export default function StoryboardPage() {
  const [script, setScript] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [frameCount, setFrameCount] = useState(6)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [frames, setFrames] = useState<StoryboardFrame[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { user } = useAuth()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!script.trim()) return

    setLoading(true)
    setError('')
    setFrames([])

    try {
      const data = await apiFetch<Storyboard>('/api/storyboard/generate', {
        method: 'POST',
        body: JSON.stringify({ scriptContent: script, style, frameCount }),
      })
      setFrames(data.frames || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '分镜生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Layout title="分镜设计" description="AI 将脚本转化为可视化分镜">
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple text-sm font-medium mb-4">
              <ImageIcon className="w-4 h-4" />
              AI 分镜设计
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              把脚本变成画面
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              粘贴脚本内容，AI 自动生成每一场景的画面描述和视觉提示词。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="glass-card-dark p-6 border border-gold-500/20 sticky top-24">
                <form onSubmit={handleGenerate} className="space-y-5">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">脚本内容</label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="粘贴你的短视频脚本..."
                      rows={8}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">视觉风格</label>
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

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">分镜数量：{frameCount}</label>
                    <input
                      type="range"
                      min={3}
                      max={12}
                      value={frameCount}
                      onChange={(e) => setFrameCount(Number(e.target.value))}
                      className="w-full accent-gold-500"
                    />
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
                    {loading ? '生成中...' : '生成分镜'}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {frames.length > 0 ? (
                <div className="space-y-4">
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className="glass-card-dark p-6 border border-white/10 hover:border-gold-500/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 shrink-0">
                          <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-gray-600" />
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-2 text-gray-400 text-sm">
                            <Clock className="w-4 h-4" />
                            {frame.duration}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold text-sm">
                              {frame.sceneNumber}
                            </span>
                            <h3 className="font-bold text-white">{frame.description}</h3>
                          </div>

                          <div className="bg-gray-900/50 rounded-xl p-4 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Wand2 className="w-4 h-4 text-cyber-green" />
                              <span className="text-xs text-gray-400 uppercase tracking-wider">视觉提示词</span>
                            </div>
                            <p className="text-gray-300 text-sm font-mono leading-relaxed">{frame.visualPrompt}</p>
                          </div>

                          <button
                            onClick={() => handleCopy(frame.id, frame.visualPrompt)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:text-gold-500 hover:bg-gold-500/10 transition-all text-sm"
                          >
                            {copiedId === frame.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedId === frame.id ? '已复制' : '复制提示词'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[400px] glass-card-dark border border-white/10 flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg">左侧输入脚本，开始生成分镜</p>
                  <p className="text-sm mt-2">每个场景都会包含画面描述、视觉提示词和时长建议</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
