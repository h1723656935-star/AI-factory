import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Sparkles, User, Mail, Lock, Eye, EyeOff, Chrome, Github } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { register, user, loading, error, clearError, signInWithOAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (password !== confirmPassword) {
      return
    }

    await register({ name, email, password })
  }

  return (
    <Layout title="注册" description="注册爆款工厂AI账号，开启 AI 创作之旅">
      <div className="min-h-[calc(100vh-4rem-300px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-cyber-pink/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card-dark p-8 border border-gold-500/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 mb-4">
                <Sparkles className="w-7 h-7 text-gold-500" />
              </div>
              <h1 className="font-orbitron text-2xl font-bold text-white mb-2">创建账号</h1>
              <p className="text-gray-400 text-sm">开始你的 AI 爆款创作之旅</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    placeholder="请输入密码（至少6位）"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all"
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
                {password !== confirmPassword && confirmPassword && (
                  <p className="mt-2 text-red-400 text-sm">两次密码输入不一致</p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || password !== confirmPassword}
                className="w-full py-3 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '注册中...' : '免费注册'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gold-500/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/50 px-2 text-gray-500">或使用第三方账号</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => signInWithOAuth('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gold-500/20 text-gray-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <Chrome className="w-4 h-4" />
                Google
              </button>
              <button
                type="button"
                onClick={() => signInWithOAuth('github')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gold-500/20 text-gray-300 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <Github className="w-4 h-4" />
                GitHub
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-400">
              已有账号？{' '}
              <Link href="/login" className="text-gold-500 hover:text-gold-400 transition-colors">
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
