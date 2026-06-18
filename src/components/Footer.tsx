import Link from 'next/link'
import { Sparkles, Mail, Github, Twitter } from 'lucide-react'

const footerLinks = [
  {
    title: '产品',
    links: [
      { href: '/video-analysis', label: '视频分析' },
      { href: '/script-generator', label: '脚本生成' },
      { href: '/storyboard', label: '分镜设计' },
      { href: '/prompt-generator', label: '提示词工具' },
    ],
  },
  {
    title: '资源',
    links: [
      { href: '/pricing', label: '价格方案' },
      { href: '/history', label: '创作历史' },
      { href: '/dashboard', label: '用户控制台' },
    ],
  },
  {
    title: '支持',
    links: [
      { href: '/login', label: '登录' },
      { href: '/register', label: '注册' },
      { href: '/forgot-password', label: '找回密码' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-gold-500/20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-gold-500" />
              <span className="font-orbitron text-lg font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                爆款工厂AI
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              AI驱动的爆款短视频创作平台，让每个人都能轻松打造 viral 内容。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:hello@baokuan.ai"
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                aria-label="邮箱"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-cyber-pink hover:bg-cyber-pink/10 transition-all"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="font-orbitron text-sm font-bold text-white mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-gold-500 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gold-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} 爆款工厂AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-gold-500 transition-colors">
              隐私政策
            </Link>
            <Link href="#" className="hover:text-gold-500 transition-colors">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
