import { useState } from 'react'
import { Clock, Video, FileText, Image, Wand2, Crown, Filter, Trash2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import type { HistoryItem } from '@/types'

const filters = [
  { value: 'all', label: '全部' },
  { value: 'analysis', label: '视频分析' },
  { value: 'script', label: '脚本生成' },
  { value: 'storyboard', label: '分镜设计' },
  { value: 'prompt', label: '提示词' },
]

const icons: Record<string, React.ElementType> = {
  analysis: Video,
  script: FileText,
  storyboard: Image,
  prompt: Wand2,
  subscription: Crown,
}

const colors: Record<string, string> = {
  analysis: 'text-cyber-pink bg-cyber-pink/10',
  script: 'text-cyber-blue bg-cyber-blue/10',
  storyboard: 'text-cyber-purple bg-cyber-purple/10',
  prompt: 'text-cyber-green bg-cyber-green/10',
  subscription: 'text-gold-500 bg-gold-500/10',
}

const demoHistory: HistoryItem[] = [
  {
    id: '1',
    action_type: 'analysis',
    title: '视频分析：抖音爆款拆解',
    description: '分析了抖音某搞笑视频的结构和情绪钩子',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: '2',
    action_type: 'script',
    title: '脚本生成：美食教程',
    description: '生成了 30 秒知识风格脚本',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    action_type: 'storyboard',
    title: '分镜设计：产品宣传片',
    description: '生成了 6 帧电影感分镜',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    action_type: 'prompt',
    title: '提示词：赛博朋克封面',
    description: '生成了 Midjourney 风格的封面提示词',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: '5',
    action_type: 'analysis',
    title: '视频分析：小红书种草视频',
    description: '分析了小红书某美妆种草视频',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [history, setHistory] = useState<HistoryItem[]>(demoHistory)
  const { user } = useAuth()

  const filtered = activeFilter === 'all'
    ? history
    : history.filter((item) => item.action_type === activeFilter)

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearAll = () => {
    setHistory([])
  }

  return (
    <Layout title="历史记录" description="查看你的 AI 创作历史记录">
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-orbitron text-3xl font-bold text-white mb-2">创作历史</h1>
              <p className="text-gray-400">查看和管理你所有的 AI 创作记录</p>
            </div>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-sm"
            >
              <Trash2 className="w-4 h-4" />
              清空记录
            </button>
          </div>

          <div className="glass-card-dark p-4 border border-gold-500/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gold-500" />
              <span className="text-sm text-gray-400">筛选类型</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === filter.value
                      ? 'bg-gold-500 text-black'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const Icon = icons[item.action_type] || Clock
                const colorClass = colors[item.action_type] || 'text-gray-400 bg-white/5'

                return (
                  <div
                    key={item.id}
                    className="glass-card-dark p-5 border border-white/10 hover:border-gold-500/30 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="glass-card-dark p-12 border border-white/10 text-center">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold text-white mb-2">暂无记录</h3>
                <p className="text-gray-400">快去使用创作工具生成你的第一个作品吧</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}
