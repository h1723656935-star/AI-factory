import { Video, FileText, Image, Wand2, BarChart3, Sparkles, Shield, Clock } from 'lucide-react'

const features = [
  {
    icon: Video,
    title: '爆款视频分析',
    description: '深度拆解热门视频结构，分析标题、情绪钩子、冲突点、反转点，提炼爆款密码。',
    color: 'text-cyber-pink',
    bg: 'bg-cyber-pink/10',
    border: 'border-cyber-pink/30',
  },
  {
    icon: FileText,
    title: 'AI 脚本生成',
    description: '基于视频分析结果，一键生成多种风格的爆款脚本，支持搞笑、情感、知识等类型。',
    color: 'text-cyber-blue',
    bg: 'bg-cyber-blue/10',
    border: 'border-cyber-blue/30',
  },
  {
    icon: Image,
    title: '智能分镜设计',
    description: '自动将脚本转化为可视化分镜，包含画面描述、视觉提示词和时长建议。',
    color: 'text-cyber-purple',
    bg: 'bg-cyber-purple/10',
    border: 'border-cyber-purple/30',
  },
  {
    icon: Wand2,
    title: '提示词工具',
    description: '为 Midjourney、Stable Diffusion、DALL·E 等 AI 绘图工具生成专业提示词。',
    color: 'text-cyber-green',
    bg: 'bg-cyber-green/10',
    border: 'border-cyber-green/30',
  },
  {
    icon: BarChart3,
    title: '数据洞察',
    description: '追踪内容表现趋势，用数据驱动创作决策，持续提升爆款命中率。',
    color: 'text-gold-500',
    bg: 'bg-gold-500/10',
    border: 'border-gold-500/30',
  },
  {
    icon: Shield,
    title: '企业级安全',
    description: '基于 Supabase 的安全架构，保障你的创作数据和账号隐私安全。',
    color: 'text-cyber-orange',
    bg: 'bg-cyber-orange/10',
    border: 'border-cyber-orange/30',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            核心功能
          </div>
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
            全链路 AI 创作工具
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            从灵感分析到内容产出，每个环节都有 AI 助手陪伴，让创作效率倍增。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`glass-card-dark p-6 border ${feature.border} hover:scale-[1.02] transition-all group`}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:animate-pulse-glow`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="font-orbitron text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
