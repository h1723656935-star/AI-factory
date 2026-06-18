import { useState, useEffect } from 'react'
import { User, Mail, Bell, Settings, Save, Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  
  const { user, loading: authLoading, updateProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }

    if (user) {
      setName(user.name)
      setEmail(user.email)
      setNotifications(user.preferences?.notifications || true)
      setTheme(user.preferences?.theme || 'dark')
    }
  }, [user, authLoading, router])

  const handleSaveProfile = async () => {
    setError('')
    
    if (!name) {
      setError('请输入用户名')
      return
    }

    await updateProfile({
      name,
      preferences: {
        theme,
        notifications,
      },
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChangePassword = async () => {
    setError('')

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('请填写所有密码字段')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('两次新密码输入不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密码至少需要6个字符')
      return
    }

    const supabase = createClient()
    const { error: changeError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (changeError) {
      setError(changeError.message)
    } else {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (authLoading) {
    return (
      <Layout title="个人资料">
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="个人资料">
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="section-title">个人资料</h1>
              <p className="text-gray-400">管理您的账号信息和偏好设置</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gold-500/20 flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-gold-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{user?.name}</h3>
                  <p className="text-gray-400">{user?.email}</p>
                  <span className={`mt-2 px-3 py-1 rounded-full text-sm ${
                    user?.role === 'free' ? 'bg-gray-500/20 text-gray-400' :
                    user?.role === 'basic' ? 'bg-blue-500/20 text-blue-400' :
                    user?.role === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gold-500/20 text-gold-500'
                  }`}>
                    {user?.role === 'free' ? '免费版' :
                     user?.role === 'basic' ? '基础版' :
                     user?.role === 'premium' ? '高级版' :
                     user?.role === 'enterprise' ? '企业版' : '管理员'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-black-700/50 rounded-lg">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">账号设置</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gold-500/10 rounded-lg border border-gold-500/30">
                    <User className="w-5 h-5 text-gold-500" />
                    <span className="text-gold-500">个人资料</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gold-500/20">
                  <p className="text-gray-500 text-sm">账号创建时间</p>
                  <p className="text-white mt-1">{formatDate(user?.created_at || '')}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-6">
                <h2 className="font-display text-lg font-bold text-white mb-6">基本信息</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">用户名</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-500/50" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field pl-12"
                        placeholder="请输入用户名"
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
                        disabled
                        className="input-field pl-12 bg-black-700 cursor-not-allowed"
                        placeholder="请输入邮箱"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  <button
                    onClick={handleSaveProfile}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saved ? '已保存' : '保存更改'}
                  </button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-display text-lg font-bold text-white mb-6">安全设置</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">当前密码</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="请输入当前密码"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-500"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">新密码</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="请输入新密码（至少6个字符）"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-500"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">确认新密码</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="请再次输入新密码"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-500"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    修改密码
                  </button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-display text-lg font-bold text-white mb-6">偏好设置</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-gold-500" />
                      <span className="text-gray-300">深色模式</span>
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        theme === 'dark' ? 'bg-gold-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        theme === 'dark' ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gold-500" />
                      <span className="text-gray-300">邮件通知</span>
                      <span className="text-gray-500 text-sm">接收产品更新和促销信息</span>
                    </div>
                    <button
                      onClick={() => setNotifications(!notifications)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        notifications ? 'bg-gold-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        notifications ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}