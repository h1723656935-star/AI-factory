// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler, successResponse } from '@/lib/api'

// 爆款 Prompt 库
const hotPrompts = [
  {
    id: 'hp-001', title: '宋代闺秀写真', platform: 'midjourney', category: '国风',
    prompt: 'A beautiful Song Dynasty lady in traditional hanfu, delicate gold embroidery, ancient Chinese courtyard, cherry blossoms falling, soft natural lighting, 85mm f/1.4, portrait photography, cinematic composition, masterpiece, best quality, ultra detailed --ar 3:4 --stylize 250 --v 6.0',
    likes: 2847, style: 'cinematic', tags: ['国风', '宋代', '写真', '汉服'],
  },
  {
    id: 'hp-002', title: '赛博朋克城市夜景', platform: 'midjourney', category: '赛博朋克',
    prompt: 'Cyberpunk city at night, neon lights reflecting on rain-slicked streets, flying cars, holographic billboards, futuristic megacity, volumetric lighting, blade runner aesthetic, wide angle, cinematic, masterpiece, best quality, ultra detailed --ar 16:9 --stylize 300 --v 6.0',
    likes: 2156, style: 'cyberpunk', tags: ['赛博朋克', '夜景', '城市', '霓虹'],
  },
  {
    id: 'hp-003', title: '古风仙侠女神', platform: 'jimeng', category: '国风',
    prompt: '仙气飘飘的古风女神，白色长裙，长发飘逸，花瓣飘落，云雾缭绕，仙境场景，柔和光线，电影感，精美画质',
    likes: 3521, style: 'fantasy', tags: ['国风', '仙侠', '女神', '飘逸'],
  },
  {
    id: 'hp-004', title: '动漫少女特写', platform: 'midjourney', category: '动漫',
    prompt: 'Anime girl portrait, beautiful detailed eyes, soft expression, cherry blossom petals, wind blown hair, studio Ghibli inspired, soft lighting, pastel colors, bokeh background, masterpiece, best quality --ar 2:3 --stylize 200 --v 6.0',
    likes: 1987, style: 'anime', tags: ['动漫', '少女', '特写', '吉卜力'],
  },
  {
    id: 'hp-005', title: '电商产品图', platform: 'midjourney', category: '电商',
    prompt: 'Product photography, luxury perfume bottle, crystal glass, golden accents, studio lighting, softbox, white seamless background, commercial photography, 100mm macro lens, sharp focus, masterpiece, best quality, ultra detailed --ar 1:1 --v 6.0',
    likes: 1678, style: 'realistic', tags: ['电商', '产品', '摄影', '商业'],
  },
  {
    id: 'hp-006', title: '吉卜力风格场景', platform: 'midjourney', category: '动漫',
    prompt: 'Studio Ghibli style, peaceful countryside landscape, rolling green hills, cozy cottage, wind blowing through grass, blue sky with fluffy clouds, warm sunlight, hand-drawn animation aesthetic, masterpiece --ar 16:9 --stylize 250 --v 6.0',
    likes: 4231, style: 'anime', tags: ['吉卜力', '场景', '乡村', '治愈'],
  },
  {
    id: 'hp-007', title: '黑神话风格角色', platform: 'midjourney', category: '游戏',
    prompt: 'Black Myth Wukong style, Chinese mythological warrior, intricate armor, fur texture, dramatic lighting, dark atmosphere, epic fantasy, photorealistic, masterpiece, best quality, ultra detailed --ar 2:3 --stylize 300 --v 6.0',
    likes: 2987, style: 'fantasy', tags: ['黑神话', '角色', '神话', '暗黑'],
  },
  {
    id: 'hp-008', title: '极简海报设计', platform: 'midjourney', category: '海报',
    prompt: 'Minimalist poster design, negative space, elegant typography, simple geometric shapes, muted color palette, sophisticated composition, gallery quality, clean aesthetic --ar 2:3 --stylize 150 --v 6.0',
    likes: 1345, style: 'minimal', tags: ['海报', '极简', '设计', '艺术'],
  },
  {
    id: 'hp-009', title: 'AI写真风格', platform: 'jimeng', category: '写真',
    prompt: '韩式写真风格，柔和的自然光，浅景深，美女肖像，微笑表情，浅色系服装，简约背景，电影感，高级质感',
    likes: 5123, style: 'realistic', tags: ['写真', '韩式', '肖像', '自然'],
  },
  {
    id: 'hp-010', title: '科幻太空场景', platform: 'midjourney', category: '科幻',
    prompt: 'Epic science fiction space scene, massive spaceship, nebula clouds, distant planets, star field, cinematic lighting, volumetric rays, 8k, masterpiece, best quality, ultra detailed --ar 16:9 --stylize 300 --v 6.0',
    likes: 1876, style: 'cinematic', tags: ['科幻', '太空', '飞船', '星云'],
  },
  {
    id: 'hp-011', title: '水墨山水画', platform: 'jimeng', category: '国风',
    prompt: '水墨山水画，意境深远，云雾缭绕，层峦叠嶂，松树古寺，留白构图，传统文人画风格，宣纸质感',
    likes: 2345, style: 'watercolor', tags: ['水墨', '山水', '国风', '意境'],
  },
  {
    id: 'hp-012', title: '漫剧分镜风格', platform: 'midjourney', category: '动漫',
    prompt: 'Anime storyboard style, dramatic action scene, speed lines, dynamic angle, manga panel composition, black and white with red accents, cel shading, comic book aesthetic --ar 16:9 --v 6.0',
    likes: 1654, style: 'anime', tags: ['漫剧', '分镜', '动作', '漫画'],
  },
]

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { category } = req.query
  let items = hotPrompts
  if (category && category !== 'all') {
    items = hotPrompts.filter((p) => p.category === category)
  }
  return successResponse(res, items)
}

export default withErrorHandler(handler)