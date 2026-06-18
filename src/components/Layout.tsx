import Head from 'next/head'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  fullWidth?: boolean
}

export function Layout({
  children,
  title = '爆款工厂AI',
  description = 'AI驱动的爆款短视频创作平台，提供视频分析、脚本生成、分镜设计、提示词工具等一站式创作工具',
  fullWidth = false,
}: LayoutProps) {
  const pageTitle = title === '爆款工厂AI' ? title : `${title} | 爆款工厂AI`

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
      </Head>
      <div className="min-h-screen flex flex-col bg-black text-white">
        <Navbar />
        <main className={`flex-1 ${fullWidth ? '' : 'w-full'}`}>{children}</main>
        <Footer />
      </div>
    </>
  )
}
