import { useState } from 'react'
import { useRouter } from 'next/router'
import {
  Video,
  Link as LinkIcon,
  Sparkles,
  BarChart3,
  Zap,
  AlertTriangle,
  TrendingUp,
  Smile,
  Frown,
  RefreshCw,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import type { VideoAnalysis } from '@/types'

const demoResult: Partial<VideoAnalysis> = {
  platform: 'douyin',
  status: 'complete',
  title_analysis: {
    mainTitle: '这条视频为什么能火？深度拆解爆款密码',
    subTitle: '揭秘短视频流量密码，看完你也能做爆款',
    keywords: ['爆款', '流量', '短视频', '密码', '拆解'],
    sentiment: 'positive',
  },
  emotional_hooks: [
    { type: 'curiosity', strength: 85, content: '你知道为什么别人的视频能上热门吗？' },
    { type: 'surprise', strength: 70, content: '这条视频只用了3秒就抓住了观众注意力' },
    { type: 'joy', strength: 60, content: '看完这个技巧，你会发现原来这么简单' },
  ],
  conflict_points: [
    { timestamp: '00:05', description: '观众期待vs现实反差', intensity: 90 },
    { timestamp: '00:15', description: '常识vs反常识', intensity: 75 },
  ],
  reversal_points: [
    { timestamp: '00:20', content: '原来爆款视频的核心不是内容而是节奏', impact: 85 },
    { timestamp: '00:35', content: '最后一个技巧让你的完播率提升50%', impact: 95 },
  ],
}

export default function VideoAnalysisPage() {
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('douyin')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Partial<VideoAnalysis> | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setResult(null)

    await new Promise((resolve) => setTimeout(resolve, 1500))
    setResult(demoResult)
    setLoading(false)
  }

  const handleGenerateScript = () => {
    router.push('/script-generator')
  }

  return (
    <Layout title="视频分析" description="AI 深度拆解爆款视频结构与流量密码">
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink text-sm font-medium mb-4">
              <Video className="w-4 h-4" />
              爆款视频分析
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              拆解爆款视频的流量密码
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              粘贴视频链接，AI 自动分析标题、情绪钩子、冲突点和反转点。
            </p>
          </div>

          <div className="glass-card-dark p-6 border border-gold-500/20 mb-8">
            <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="粘贴抖音、快手、小红书等平台视频链接"
                  className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                  required
                />
              </div>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
              >
                <option value="douyin">抖音</option>
                <option value="kuaishou">快手</option>
                <option value="xiaohongshu">小红书</option>
                <option value="bilibili">B站</option>
                <option value="youtube">YouTube</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {loading ? '分析中...' : '开始分析'}
              </button>
            </form>
          </div>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card-dark p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-gold-500" />
                    <h2 className="font-orbitron text-xl font-bold text-white">标题分析</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-white font-bold text-lg">{result.title_analysis?.mainTitle}</h3>
                      <p className="text-gray-400">{result.title_analysis?.subTitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.title_analysis?.keywords?.map((kw) => (
                        <span
                          key={kw}
                          className="px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500 text-sm"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">情感倾向：</span>
                      {result.title_analysis?.sentiment === 'positive' ? (
                        <span className="flex items-center gap-1 text-cyber-green">
                          <Smile className="w-4 h-4" /> 积极
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400">
                          <Frown className="w-4 h-4" /> 消极
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-card-dark p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-cyber-pink" />
                    <h2 className="font-orbitron text-xl font-bold text-white">情绪钩子</h2>
                  </div>
                  <div className="space-y-3">
                    {result.emotional_hooks?.map((hook, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium capitalize">{hook.type}</span>
                          <span className="text-gold-500 text-sm font-bold">{hook.strength}%</span>
                        </div>
                        <p className="text-gray-400 text-xs">{hook.content}</p>
                        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyber-pink to-gold-500 rounded-full"
                            style={{ width: `${hook.strength}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card-dark p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-cyber-orange" />
                    <h2 className="font-orbitron text-xl font-bold text-white">冲突点</h2>
                  </div>
                  <div className="space-y-3">
                    {result.conflict_points?.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <span className="text-gold-500 font-mono text-sm">{point.timestamp}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm">{point.description}</p>
                          <p className="text-gray-500 text-xs mt-1">强度: {point.intensity}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card-dark p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-cyber-green" />
                    <h2 className="font-orbitron text-xl font-bold text-white">反转点</h2>
                  </div>
                  <div className="space-y-3">
                    {result.reversal_points?.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <span className="text-gold-500 font-mono text-sm">{point.timestamp}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm">{point.content}</p>
                          <p className="text-gray-500 text-xs mt-1">影响力: {point.impact}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleGenerateScript}
                  className="px-8 py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  基于分析生成脚本
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}
