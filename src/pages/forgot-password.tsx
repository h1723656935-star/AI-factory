import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { resetPassword, loading, error, clearError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    await resetPassword(email)
    setSubmitted(true)
  }

  return (
    <Layout title="找回密码" description="重置你的爆款工厂AI账号密码">
      <div className="min-h-[calc(100vh-4rem-300px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card-dark p-8 border border-gold-500/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 mb-4">
                <Sparkles className="w-7 h-7 text-gold-500" />
              </div>
              <h1 className="font-orbitron text-2xl font-bold text-white mb-2">找回密码</h1>
              <p className="text-gray-400 text-sm">输入邮箱，我们会发送重置链接</p>
            </div>

            {submitted && !error ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-cyber-green mx-auto mb-4" />
                <h2 className="font-orbitron text-xl font-bold text-white mb-2">邮件已发送</h2>
                <p className="text-gray-400 text-sm mb-6">
                  如果邮箱已注册，请查收重置密码邮件。
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回登录
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                        placeholder="请输入注册邮箱"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '发送中...' : '发送重置链接'}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回登录
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
