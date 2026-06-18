import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, Sparkles, Crown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { SubscriptionPlan } from '@/types'

const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    period: 'month',
    description: '适合个人创作者体验',
    features: ['每日 3 次视频分析', '基础脚本生成', '5 个提示词模板', '7 天历史记录'],
    is_active: true,
    priority: 1,
  },
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    original_price: 59,
    period: 'month',
    description: '适合刚起步的创作者',
    features: ['每日 20 次视频分析', '高级脚本生成', '全部分镜模板', '30 天历史记录', '优先客服支持'],
    is_active: true,
    priority: 2,
  },
  {
    id: 'premium',
    name: '高级版',
    price: 99,
    original_price: 199,
    period: 'month',
    description: '适合专业内容团队',
    features: ['无限视频分析', 'AI 智能脚本优化', '无限分镜生成', '无限历史记录', 'API 接口访问', '专属客户经理'],
    is_active: true,
    priority: 3,
    is_recommended: true,
  },
]

interface PricingSectionProps {
  plans?: SubscriptionPlan[]
}

export function PricingSection({ plans = defaultPlans }: PricingSectionProps) {
  const { user, loading: authLoading } = useAuth()
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)
  const [remotePlans, setRemotePlans] = useState<SubscriptionPlan[] | null>(null)
  const sorted = [...(remotePlans || plans)].sort((a, b) => (a.priority || 0) - (b.priority || 0))

  useEffect(() => {
    fetch('/api/subscription/plans')
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length > 0) {
          setRemotePlans(json.data)
        }
      })
      .catch(() => {
        // 使用默认计划
      })
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (!user) return
    if (planId === 'free') return

    setCheckoutPlan(planId)
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const json = await res.json()
      if (json.data?.url) {
        window.location.href = json.data.url
        return
      }
      if (json.error === 'Stripe not configured') {
        // 演示模式：直接调用创建订阅接口
        await fetch('/api/subscription/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, paymentMethod: 'demo' }),
        })
        window.location.href = '/dashboard?subscription=success'
      }
    } finally {
      setCheckoutPlan(null)
    }
  }

  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyber-purple/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-500 text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            价格方案
          </div>
          <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
            选择适合你的创作计划
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            从免费体验到企业级服务，满足不同阶段创作者的需求。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sorted.map((plan) => {
            const isCurrent = user?.role === plan.id
            const isLoading = checkoutPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all hover:scale-[1.02] ${
                  plan.is_recommended
                    ? 'bg-gradient-to-b from-gold-500/20 to-black border-2 border-gold-500'
                    : 'glass-card-dark border border-white/10'
                }`}
              >
                {plan.is_recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold-500 text-black text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    最受欢迎
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-orbitron text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="font-orbitron text-4xl font-bold text-white">¥{plan.price}</span>
                    <span className="text-gray-400 mb-1">/{plan.period === 'year' ? '年' : '月'}</span>
                  </div>
                  {plan.original_price && plan.original_price > plan.price && (
                    <span className="text-gray-500 line-through text-sm">¥{plan.original_price}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className={`w-5 h-5 shrink-0 ${plan.is_recommended ? 'text-gold-500' : 'text-cyber-green'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {user ? (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || isLoading || authLoading || plan.price === 0}
                    className={`block w-full text-center py-3 rounded-xl font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.is_recommended
                        ? 'bg-gold-500 text-black hover:bg-gold-400'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        跳转中...
                      </span>
                    ) : isCurrent ? (
                      '当前方案'
                    ) : plan.price === 0 ? (
                      '免费方案'
                    ) : (
                      '立即订阅'
                    )}
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className={`block w-full text-center py-3 rounded-xl font-bold transition-all ${
                      plan.is_recommended
                        ? 'bg-gold-500 text-black hover:bg-gold-400'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {plan.price === 0 ? '免费开始' : '立即订阅'}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
