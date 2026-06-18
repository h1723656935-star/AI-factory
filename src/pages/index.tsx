import dynamic from 'next/dynamic'
import { Layout } from '@/components/Layout'
import { HeroSection } from '@/components/HeroSection'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

const FeaturesSection = dynamic(() => import('@/components/FeaturesSection').then((mod) => mod.FeaturesSection), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-950" />,
})

const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection').then((mod) => mod.TestimonialsSection), {
  ssr: false,
  loading: () => <div className="h-96 bg-black" />,
})

export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <section className="py-24 bg-gray-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-pink/5 to-cyber-blue/5" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 text-gold-500 mx-auto mb-6" />
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-6">
            准备好打造你的下一个爆款了吗？
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            加入数万名创作者，让 AI 成为你内容创作的超级助手。
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold-500 text-black font-bold text-lg hover:bg-gold-400 transition-all hover:scale-105"
          >
            立即免费注册
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      <TestimonialsSection />
    </Layout>
  )
}
