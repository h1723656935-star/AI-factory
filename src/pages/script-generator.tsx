import { useState } from 'react'
import { FileText, Sparkles, Copy, Check, RefreshCw, Download } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

const styles = [
  { value: 'funny', label: '搞笑', emoji: '😂' },
  { value: 'emotional', label: '情感', emoji: '🥺' },
  { value: 'knowledge', label: '知识', emoji: '📚' },
  { value: 'suspense', label: '悬疑', emoji: '🎭' },
  { value: 'inspirational', label: '励志', emoji: '💪' },
  { value: 'review', label: '测评', emoji: '📦' },
]

const tones = ['轻松', '正式', '幽默', '煽情', '专业', '亲切']
const lengths = [
  { value: 'short', label: '15-30秒' },
  { value: 'medium', label: '30-60秒' },
  { value: 'long', label: '1-3分钟' },
]

const demoScript = `标题：这条视频为什么能火？深度拆解爆款密码

【开场】(0-3秒)
大家好！今天给大家带来一个超级搞笑的视频...

【正文】(3-30秒)
首先，我想问问大家，你们有没有遇到过这种情况...（搞笑场景描述）

【高潮】(30-45秒)
最搞笑的来了！你们猜发生了什么？哈哈哈...

【结尾】(45-60秒)
哈哈哈，今天的视频就到这里，别忘了点赞关注哦！`

export default function ScriptGeneratorPage() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('funny')
  const [tone, setTone] = useState('轻松')
  const [length, setLength] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState('')
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return

    setLoading(true)
    setScript('')

    await new Promise((resolve) => setTimeout(resolve, 1500))
    setScript(`标题：${topic} - 爆款脚本

【开场】(0-3秒)
${style === 'funny' ? '大家好！今天给大家带来一个超级搞笑的视频...' :
  style === 'emotional' ? '你有没有想过，一个简单的决定可能改变你的一生？' :
  style === 'knowledge' ? '今天给大家分享一个超级实用的技巧，学会了你就是大神！' :
  style === 'suspense' ? '深夜，一个神秘的电话打破了宁静...' :
  style === 'inspirational' ? '每个人都有梦想，但只有少数人能实现它...' :
  '今天我们来测评一下这款热门产品，看看它到底值不值得买！'}

【正文】(${length === 'short' ? '3-15' : length === 'medium' ? '3-30' : '3-60'}秒)
${style === 'funny' ? '首先，我想问问大家，你们有没有遇到过这种情况...' :
  style === 'emotional' ? '记得那是一个下雨天，我独自走在街头...' :
  style === 'knowledge' ? '第一步：准备好所需材料。第二步：按照以下步骤操作...' :
  style === 'suspense' ? '随着调查的深入，真相越来越扑朔迷离...' :
  style === 'inspirational' ? '成功的路上并不拥挤，因为坚持的人不多...' :
  '这款产品的外观设计非常精致，手感也很不错...'}

【高潮】(${length === 'short' ? '15-25' : length === 'medium' ? '30-45' : '60-120'}秒)
${style === 'funny' ? '最搞笑的来了！你们猜发生了什么？哈哈哈...' :
  style === 'emotional' ? '就在那一刻，我终于明白了什么是真正的爱...' :
  style === 'knowledge' ? '重点来了！记住这个关键步骤，这是整个技巧的核心...' :
  style === 'suspense' ? '真相大白！原来凶手竟然是...' :
  style === 'inspirational' ? '只要你不放弃，奇迹就会发生！' :
  '但是！当我使用一段时间后，发现了一个严重的问题...'}

【结尾】(${length === 'short' ? '25-30' : length === 'medium' ? '45-60' : '120-180'}秒)
${style === 'funny' ? '哈哈哈，今天的视频就到这里，别忘了点赞关注哦！' :
  style === 'emotional' ? '希望这个故事能给你带来一些温暖...' :
  style === 'knowledge' ? '学会了吗？记得点赞收藏，下次还会分享更多干货！' :
  style === 'suspense' ? '想知道后续发展？记得关注我，下集更精彩！' :
  style === 'inspirational' ? '相信自己，你比想象中更强大！' :
  '总体来说，这款产品值得购买，但有一些小瑕疵需要注意...'}

风格：${styles.find(s => s.value === style)?.label} | 语气：${tone} | 时长：${lengths.find(l => l.value === length)?.label}`)
    setLoading(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `爆款脚本-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="脚本生成" description="AI 一键生成爆款短视频脚本">
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              AI 脚本生成
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              让 AI 帮你写爆款脚本
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              输入视频主题，选择风格和语气，秒级生成专业短视频脚本。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card-dark p-6 border border-gold-500/20">
              <form onSubmit={handleGenerate} className="space-y-5">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">视频主题 / 关键词</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例如：如何做出爆款的早餐视频"
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">脚本风格</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {styles.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStyle(s.value)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          style === s.value
                            ? 'bg-gold-500 text-black'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span className="mr-1">{s.emoji}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">语气</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                    >
                      {tones.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">时长</label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                    >
                      {lengths.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
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
                  {loading ? '生成中...' : '生成脚本'}
                </button>
              </form>
            </div>

            <div className="glass-card-dark p-6 border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-orbitron text-xl font-bold text-white">生成结果</h2>
                {script && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                      title="复制"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
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

              <div className="flex-1 bg-gray-900/50 rounded-xl p-4 overflow-auto min-h-[300px]">
                {script ? (
                  <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {script}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <FileText className="w-12 h-12 mb-3 opacity-30" />
                    <p>左侧输入主题，点击生成按钮</p>
                    <p className="text-sm mt-1">AI 将为你生成专业短视频脚本</p>
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
