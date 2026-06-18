import Link from 'next/link'
import { ArrowRight, Play, Zap, TrendingUp, Wand2 } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-pink/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyber-blue/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgwVjQwWiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDQwaDQwVjBIMFY0MFoiIGZpbGw9InJnYmEoMjU1LDIxNSwwLDAuMDIpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500 text-sm font-medium mb-8">
          <Zap className="w-4 h-4" />
          AI 驱动的爆款短视频创作平台
        </div>

        <h1 className="font-orbitron text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          让每一个创意
          <span className="block bg-gradient-to-r from-gold-400 via-cyber-pink to-cyber-blue bg-clip-text text-transparent">
            都成为爆款
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          视频分析、脚本生成、分镜设计、提示词工具，一站式 AI 创作工作台，助你轻松打造 viral 内容。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gold-500 text-black font-bold text-lg hover:bg-gold-400 transition-all hover:scale-105"
          >
            免费开始创作
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/video-analysis"
            className="flex items-center gap-2 px-8 py-4 rounded-full border border-gold-500/50 text-gold-500 font-bold text-lg hover:bg-gold-500/10 transition-all"
          >
            <Play className="w-5 h-5" />
            体验视频分析
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: TrendingUp, label: '爆款分析', value: '10万+' },
            { icon: Wand2, label: 'AI 生成', value: '50万+' },
            { icon: Play, label: '创作者', value: '5万+' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card-dark p-6 hover:border-gold-500/50 transition-all"
            >
              <stat.icon className="w-8 h-8 text-gold-500 mx-auto mb-3" />
              <div className="font-orbitron text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
