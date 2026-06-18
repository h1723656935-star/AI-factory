import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        <meta name="description" content="爆款工厂AI - AI驱动的爆款视频创作平台，提供视频分析、脚本生成、分镜设计、提示词工具等一站式创作工具" />
        <meta name="keywords" content="AI视频分析,脚本生成,分镜设计,提示词工具,短视频创作,爆款视频" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}