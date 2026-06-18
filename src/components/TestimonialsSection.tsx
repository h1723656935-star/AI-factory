import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: '李明',
    role: '短视频博主',
    avatar: 'L',
    content: '用了爆款工厂AI后，我的视频完播率提升了40%。脚本生成功能特别懂短视频节奏，省去了大量构思时间。',
    rating: 5,
  },
  {
    name: '王芳',
    role: 'MCN 内容总监',
    avatar: 'W',
    content: '我们团队每天需要产出大量脚本，这个工具的视频分析和分镜功能让效率提升了3倍，强烈推荐给内容团队。',
    rating: 5,
  },
  {
    name: '张伟',
    role: '独立创作者',
    avatar: 'Z',
    content: '提示词工具生成的 Midjourney 描述非常专业，画面感和爆款标题结合得很好，帮我做出了很多爆款封面。',
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyber-blue/10 rounded-full blur-3xl -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink text-sm font-medium mb-4">
            <Quote className="w-4 h-4" />
            用户评价
          </div>
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
            创作者们都在说
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            来自各行各业的创作者，正在用 AI 重新定义内容生产。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="glass-card-dark p-8 border border-white/10 hover:border-gold-500/30 transition-all"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gold-500 fill-gold-500" />
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">&ldquo;{item.content}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-cyber-pink flex items-center justify-center text-black font-bold">
                  {item.avatar}
                </div>
                <div>
                  <div className="font-medium text-white">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
