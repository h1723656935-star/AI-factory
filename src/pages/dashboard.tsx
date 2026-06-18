import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Video,
  FileText,
  Image,
  Wand2,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'

const tools = [
  { href: '/video-analysis', label: '视频分析', icon: Video, desc: '拆解爆款密码', color: 'text-cyber-pink', bg: 'bg-cyber-pink/10' },
  { href: '/script-generator', label: '脚本生成', icon: FileText, desc: 'AI 写脚本', color: 'text-cyber-blue', bg: 'bg-cyber-blue/10' },
  { href: '/storyboard', label: '分镜设计', icon: Image, desc: '可视化分镜', color: 'text-cyber-purple', bg: 'bg-cyber-purple/10' },
  { href: '/prompt-generator', label: '提示词', icon: Wand2, desc: 'AI 绘图提示', color: 'text-cyber-green', bg: 'bg-cyber-green/10' },
]

const recentActivities = [
  { title: '视频分析完成', desc: '分析了一条抖音爆款视频', time: '10分钟前', icon: Video, color: 'text-cyber-pink' },
  { title: '脚本已生成', desc: '生成了搞笑风格脚本', time: '2小时前', icon: FileText, color: 'text-cyber-blue' },
  { title: '分镜已保存', desc: '保存了 6 帧分镜设计', time: '昨天', icon: Image, color: 'text-cyber-purple' },
  { title: '提示词已复制', desc: '复制了 Midjourney 提示词', time: '3天前', icon: Wand2, color: 'text-cyber-green' },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <Layout title="控制台">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!user) return null

  return (
    <Layout title="控制台">
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card-dark p-8 mb-8 border border-gold-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-orbitron text-3xl font-bold text-white mb-2">
                  欢迎回来，{user.name}
                </h1>
                <p className="text-gray-400">
                  今天也是创作爆款的好日子。账号创建于 {formatDate(user.created_at)}
                </p>
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                {user.role === 'free' ? '升级会员' : '管理订阅'}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: '视频分析', value: '128', change: '+12%', icon: Video, color: 'text-cyber-pink' },
              { label: '脚本生成', value: '56', change: '+8%', icon: FileText, color: 'text-cyber-blue' },
              { label: '分镜设计', value: '34', change: '+15%', icon: Image, color: 'text-cyber-purple' },
              { label: '提示词生成', value: '89', change: '+23%', icon: Wand2, color: 'text-cyber-green' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card-dark p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  <span className="text-cyber-green text-sm font-medium">{stat.change}</span>
                </div>
                <div className="font-orbitron text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="glass-card-dark p-6 border border-white/10">
                <h2 className="font-orbitron text-xl font-bold text-white mb-6">创作工具</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-gold-500/30 hover:bg-gold-500/5 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <tool.icon className={`w-6 h-6 ${tool.color}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-white mb-1">{tool.label}</h3>
                          <p className="text-gray-400 text-sm">{tool.desc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="glass-card-dark p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-orbitron text-xl font-bold text-white">最近动态</h2>
                  <Link href="/history" className="text-sm text-gold-500 hover:text-gold-400 transition-colors">
                    查看全部
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-medium truncate">{activity.title}</h4>
                        <p className="text-gray-500 text-xs truncate">{activity.desc}</p>
                      </div>
                      <span className="text-gray-500 text-xs shrink-0">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
