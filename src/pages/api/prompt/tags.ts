// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler, successResponse } from '@/lib/api'

// 标签库数据
const tagLibrary = [
  {
    name: 'photography',
    label: '摄影',
    icon: '📷',
    tags: [
      'cinematic lighting', 'depth of field', 'bokeh', '85mm lens', 'f/1.4 aperture',
      'shallow depth of field', 'anamorphic lens', 'film grain', '35mm film aesthetic',
      'golden hour', 'blue hour', 'soft focus', 'tilt-shift', 'fisheye lens',
    ],
  },
  {
    name: 'guofeng',
    label: '国风',
    icon: '🏮',
    tags: [
      '宋代美学', '敦煌风', '工笔重彩', '泥金重彩', '水墨画风', '唐风', '汉服',
      '传统纹样', '青绿山水', '没骨画法', '白描', '金碧山水', '仕女图',
      '仙鹤', '凤凰', '龙纹', '祥云', '莲花纹', '如意纹', '中国红',
    ],
  },
  {
    name: 'anime',
    label: '漫剧',
    icon: '🎨',
    tags: [
      'anime storyboard', 'comic scene', 'dramatic shot', 'cel shading', '2D animation',
      'manga style', 'anime key visual', 'Studio Ghibli', 'Makoto Shinkai style',
      'anime background art', 'speed lines', 'anime action scene', 'chibi style',
    ],
  },
  {
    name: 'ecommerce',
    label: '电商',
    icon: '🛍️',
    tags: [
      'product photography', 'studio lighting', 'commercial advertising', 'white background',
      'product showcase', 'jewelry photography', 'cosmetics photography', 'fashion editorial',
      'clean product shot', 'e-commerce photography', 'ghost mannequin', 'flat lay',
    ],
  },
  {
    name: 'portrait',
    label: '人像',
    icon: '👤',
    tags: [
      'portrait photography', 'beauty shot', 'fashion portrait', 'editorial portrait',
      'headshot', 'candid portrait', 'environmental portrait', 'fine art portrait',
      'Rembrandt lighting', 'butterfly lighting', 'split lighting', 'loop lighting',
      'subsurface scattering', 'skin texture', 'pore detail', 'natural makeup',
    ],
  },
  {
    name: 'landscape',
    label: '场景',
    icon: '🏔️',
    tags: [
      'epic landscape', 'wide vista', 'misty mountains', 'cherry blossom', 'ancient temple',
      'futuristic city', 'floating islands', 'enchanted forest', 'cyberpunk street',
      'traditional courtyard', 'bamboo forest', 'moonlit lake', 'snowy peak',
    ],
  },
  {
    name: 'quality',
    label: '画质',
    icon: '💎',
    tags: [
      'masterpiece', 'best quality', 'ultra detailed', '8k', '16k', 'photorealistic',
      'hyper-realistic', 'award-winning', 'magazine quality', 'gallery worthy',
      'professional photography', 'HDR', 'high resolution', 'crisp quality',
      'ray tracing', 'global illumination', 'octane render', 'unreal engine 5',
    ],
  },
  {
    name: 'effects',
    label: '特效',
    icon: '✨',
    tags: [
      'particle effects', 'light rays', 'god rays', 'lens flare', 'sparkles',
      'glowing particles', 'magical aura', 'smoke effects', 'fire effects',
      'water splash', 'energy burst', 'crystal refraction', 'holographic',
      'motion blur', 'slow shutter', 'long exposure', 'light trails',
    ],
  },
]

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return successResponse(res, tagLibrary)
}

export default withErrorHandler(handler)