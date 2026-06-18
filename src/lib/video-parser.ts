/**
 * 视频平台元数据解析
 * 当前支持 YouTube 公开 oEmbed 接口
 * 国内平台（抖音/快手/小红书/B站）需要官方 API 或第三方解析服务
 */

export interface VideoMetadata {
  title: string
  author: string
  description: string
  thumbnailUrl: string
  platform: string
  originalUrl: string
}

export function detectPlatform(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('douyin')) return 'douyin'
  if (lower.includes('kuaishou')) return 'kuaishou'
  if (lower.includes('xiaohongshu') || lower.includes('xhs')) return 'xiaohongshu'
  if (lower.includes('bilibili') || lower.includes('b23.tv')) return 'bilibili'
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'youtube'
  return 'unknown'
}

async function parseYouTube(url: string): Promise<Partial<VideoMetadata>> {
  try {
    const encodedUrl = encodeURIComponent(url)
    const res = await fetch(`https://noembed.com/embed?url=${encodedUrl}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      title: data.title || '',
      author: data.author_name || '',
      description: '', // noembed 不提供描述
      thumbnailUrl: data.thumbnail_url || '',
    }
  } catch {
    return {}
  }
}

/**
 * 解析视频链接元数据
 * 返回尽可能丰富的信息，用于后续 LLM 分析
 */
export async function parseVideoUrl(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url)
  let metadata: Partial<VideoMetadata> = {}

  try {
    if (platform === 'youtube') {
      metadata = await parseYouTube(url)
    }

    // 抖音、快手、小红书、B站等平台
    // 如果有配置 VIDEO_PARSER_API_URL，可调用第三方解析服务
    if (['douyin', 'kuaishou', 'xiaohongshu', 'bilibili'].includes(platform)) {
      const parserUrl = process.env.VIDEO_PARSER_API_URL
      const parserKey = process.env.VIDEO_PARSER_API_KEY
      if (parserUrl) {
        const res = await fetch(parserUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(parserKey ? { Authorization: `Bearer ${parserKey}` } : {}),
          },
          body: JSON.stringify({ url }),
        })
        if (res.ok) {
          const data = await res.json()
          metadata = {
            title: data.title || data.data?.title || '',
            author: data.author || data.data?.author || '',
            description: data.description || data.data?.desc || '',
            thumbnailUrl: data.thumbnail || data.data?.cover || '',
          }
        }
      }
    }
  } catch {
    // 任何解析失败都回退到基础信息
  }

  return {
    title: metadata.title || '',
    author: metadata.author || '',
    description: metadata.description || '',
    thumbnailUrl: metadata.thumbnailUrl || '',
    platform,
    originalUrl: url,
  }
}
