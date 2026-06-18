import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  Zap,
  Video,
  FileText,
  Image,
  Wand2,
  Clock,
  CreditCard,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

const navLinks = [
  { href: '/', label: '首页' },
  { href: '/pricing', label: '价格' },
]

const toolLinks = [
  { href: '/video-analysis', label: '视频分析', icon: Video },
  { href: '/script-generator', label: '脚本生成', icon: FileText },
  { href: '/storyboard', label: '分镜设计', icon: Image },
  { href: '/prompt-generator', label: '提示词', icon: Wand2 },
  { href: '/history', label: '历史记录', icon: Clock },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme, mounted } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gold-500/20 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-gold-500 group-hover:text-cyber-pink transition-colors" />
              <div className="absolute inset-0 bg-gold-500/20 blur-lg rounded-full group-hover:bg-cyber-pink/20 transition-colors" />
            </div>
            <span className="font-orbitron text-xl font-bold bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 bg-clip-text text-transparent">
              爆款工厂AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  router.pathname === link.href
                    ? 'text-gold-500 bg-gold-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="relative group ml-2">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                <Zap className="w-4 h-4 text-gold-500" />
                创作工具
              </button>
              <div className="absolute top-full left-0 w-48 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="glass-card-dark overflow-hidden py-2">
                  {toolLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-300 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
              aria-label="切换主题"
            >
              {mounted ? (
                resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-3 ml-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  <User className="w-4 h-4" />
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  aria-label="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gold-500 text-black hover:bg-gold-400 transition-all"
                >
                  免费试用
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gold-500/20 bg-black/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  router.pathname === link.href
                    ? 'text-gold-500 bg-gold-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gold-500/20">
              <p className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">创作工具</p>
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="pt-2 border-t border-gold-500/20">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                  >
                    <User className="w-4 h-4" />
                    {user.name}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-lg text-center text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-lg text-center text-sm font-medium bg-gold-500 text-black hover:bg-gold-400 transition-all"
                  >
                    免费试用
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
