import { Layout } from '@/components/Layout'
import { PricingSection } from '@/components/PricingSection'
import { Check, HelpCircle, ArrowRight } from 'lucide-react'

const faqs = [
  {
    q: '免费版和付费版有什么区别？',
    a: '免费版每天可以使用 3 次视频分析，适合体验产品。付费版提供更多的使用次数、高级功能和更长的历史记录保存时间。',
  },
  {
    q: '可以随时取消订阅吗？',
    a: '当然可以。你可以随时在账户设置中取消订阅，取消后当前周期仍可继续使用。',
  },
  {
    q: '支持哪些视频平台？',
    a: '目前支持抖音、快手、小红书、B站、YouTube 等主流短视频平台，后续会支持更多平台。',
  },
  {
    q: '生成的内容可以商用吗？',
    a: '是的，所有通过爆款工厂AI生成的脚本、分镜和提示词均可用于商业创作。',
  },
]

export default function PricingPage() {
  return (
    <Layout title="价格" description="选择适合你的爆款工厂AI订阅方案">
      <PricingSection />

      <section className="py-24 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              常见问题
            </div>
            <h2 className="font-orbitron text-3xl font-bold text-white">价格相关 FAQ</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card-dark p-6 border border-white/10">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <Check className="w-5 h-5 text-gold-500" />
                  {faq.q}
                </h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-orbitron text-3xl font-bold text-white mb-4">还有疑问？</h2>
          <p className="text-gray-400 mb-8">我们的团队随时准备为你解答</p>
          <a
            href="mailto:hello@baokuan.ai"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all"
          >
            联系我们
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </Layout>
  )
}
