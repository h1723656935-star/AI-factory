// @ts-nocheck
import type { PromptTemplate } from '@/types'

/**
 * ============================================================
 * Prompt 模板驱动引擎
 * ============================================================
 * 支持占位符：
 *   {subject}  — 主体描述
 *   {scene}    — 场景/背景
 *   {lighting} — 光影系统
 *   {camera}   — 镜头语言
 *   {quality}  — 画质等级
 *   {style}    — 风格关键词
 *   {mood}     — 情绪氛围
 *   {details}  — 额外细节
 * ============================================================
 */

// ==================== 预设模板库 ====================

const defaultTemplates: PromptTemplate[] = [
  // ===== Midjourney 模板 =====
  {
    id: 'tpl-mj-cinematic-01',
    name: '电影感人像',
    platform: 'midjourney',
    style: 'cinematic',
    category: '人像',
    template: '{subject}, {scene}, {lighting}, {camera}, cinematic composition, anamorphic lens, 85mm f/1.4, {quality}, masterpiece, best quality, ultra detailed --ar 3:4 --stylize 250 --v 6.0',
    description: '电影感人像，含相机参数和MJ专属参数',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-cinematic-02',
    name: '电影感场景',
    platform: 'midjourney',
    style: 'cinematic',
    category: '场景',
    template: '{subject}, {scene}, epic wide shot, {lighting}, {camera}, cinematic composition, immersive atmosphere, dramatic scale, {quality}, masterpiece, best quality, ultra detailed --ar 16:9 --stylize 300 --v 6.0',
    description: '电影感场景，适合宏大叙事',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-mj-anime-01',
    name: '动漫角色',
    platform: 'midjourney',
    style: 'anime',
    category: '动漫',
    template: '{subject}, {scene}, anime style, vibrant colors, cel shading, clean line art, {lighting}, {camera}, detailed background, {quality}, masterpiece, best quality --ar 2:3 --stylize 200 --v 6.0',
    description: '动漫角色设计',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-mj-anime-02',
    name: '吉卜力风格',
    platform: 'midjourney',
    style: 'anime',
    category: '动漫',
    template: '{subject}, {scene}, Studio Ghibli inspired, soft watercolor aesthetic, {lighting}, hand-drawn animation, {camera}, nostalgic atmosphere, {quality}, masterpiece --ar 16:9 --stylize 250 --v 6.0',
    description: '吉卜力风格场景',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-mj-realistic-01',
    name: '超写实肖像',
    platform: 'midjourney',
    style: 'realistic',
    category: '人像',
    template: '{subject}, {scene}, photorealistic, hyper realistic, 8k uhd, {lighting}, {camera}, subsurface scattering, skin pore detail, {quality}, masterpiece, best quality, ultra detailed, award-winning photography --ar 2:3 --stylize 150 --v 6.0',
    description: '超写实人像摄影',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-mj-realistic-02',
    name: '商业产品摄影',
    platform: 'midjourney',
    style: 'realistic',
    category: '电商',
    template: '{subject}, product photography, {scene}, {lighting}, commercial advertising, {camera}, sharp focus, {quality}, masterpiece, best quality, ultra detailed, studio photography --ar 1:1 --stylize 100 --v 6.0',
    description: '电商产品图',
    aspectRatio: '1:1',
  },
  {
    id: 'tpl-mj-cyberpunk-01',
    name: '赛博朋克城市',
    platform: 'midjourney',
    style: 'cyberpunk',
    category: '场景',
    template: '{subject}, {scene}, cyberpunk aesthetic, neon lights, rain-slicked streets, {lighting}, futuristic city, {camera}, holographic displays, {quality}, masterpiece, best quality, ultra detailed --ar 16:9 --stylize 300 --v 6.0',
    description: '赛博朋克城市夜景',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-mj-fantasy-01',
    name: '奇幻仙境',
    platform: 'midjourney',
    style: 'fantasy',
    category: '场景',
    template: '{subject}, {scene}, fantasy art, magical atmosphere, ethereal, {lighting}, floating particles, enchanted realm, {camera}, mystical, {quality}, masterpiece, best quality, ultra detailed --ar 3:4 --stylize 250 --v 6.0',
    description: '奇幻魔法场景',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-watercolor-01',
    name: '水彩画风',
    platform: 'midjourney',
    style: 'watercolor',
    category: '艺术',
    template: '{subject}, {scene}, watercolor painting, soft edges, flowing colors, delicate wash, {lighting}, artistic, wet-on-wet technique, {quality}, masterpiece --ar 3:4 --stylize 200 --v 6.0',
    description: '水彩画风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-3d-01',
    name: '3D渲染角色',
    platform: 'midjourney',
    style: '3d-render',
    category: '3D',
    template: '{subject}, {scene}, 3D render, octane render, unreal engine 5, {lighting}, {camera}, global illumination, ray tracing, {quality}, masterpiece, best quality, ultra detailed --ar 3:4 --stylize 100 --v 6.0',
    description: '3D渲染风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-noir-01',
    name: '暗黑电影',
    platform: 'midjourney',
    style: 'noir',
    category: '电影',
    template: '{subject}, {scene}, film noir, high contrast, dramatic shadows, {lighting}, monochrome, moody atmosphere, {camera}, venetian blinds, {quality}, masterpiece --ar 2:3 --stylize 200 --v 6.0',
    description: '暗黑电影风格',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-mj-vintage-01',
    name: '复古胶片',
    platform: 'midjourney',
    style: 'vintage',
    category: '摄影',
    template: '{subject}, {scene}, vintage style, retro, film photography, {lighting}, warm tones, nostalgic, grainy texture, kodak portra, {camera}, {quality}, masterpiece --ar 3:4 --stylize 200 --v 6.0',
    description: '复古胶片风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-comic-01',
    name: '漫剧分镜',
    platform: 'midjourney',
    style: 'comic',
    category: '动漫',
    template: '{subject}, {scene}, comic book style, bold outlines, halftone dots, {lighting}, dynamic panels, ben day process, {camera}, {quality}, masterpiece --ar 16:9 --stylize 150 --v 6.0',
    description: '漫画风格分镜',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-mj-surreal-01',
    name: '超现实梦境',
    platform: 'midjourney',
    style: 'surreal',
    category: '艺术',
    template: '{subject}, {scene}, surreal art, dreamlike, Salvador Dali style, {lighting}, melting forms, impossible geometry, {camera}, metaphysical, {quality}, masterpiece --ar 3:4 --stylize 250 --v 6.0',
    description: '超现实主义风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-gothic-01',
    name: '哥特美学',
    platform: 'midjourney',
    style: 'gothic',
    category: '艺术',
    template: '{subject}, {scene}, gothic style, dark romantic, Victorian aesthetic, {lighting}, ornate details, haunting beauty, cathedral, {camera}, {quality}, masterpiece --ar 3:4 --stylize 200 --v 6.0',
    description: '哥特风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-mj-minimal-01',
    name: '极简设计',
    platform: 'midjourney',
    style: 'minimal',
    category: '设计',
    template: '{subject}, {scene}, minimalist, clean background, {lighting}, negative space, elegant, zen aesthetic, {camera}, {quality}, masterpiece --ar 1:1 --stylize 100 --v 6.0',
    description: '极简设计风格',
    aspectRatio: '1:1',
  },

  // ===== Flux 模板 =====
  {
    id: 'tpl-flux-cinematic-01',
    name: 'Flux 电影人像',
    platform: 'flux',
    style: 'cinematic',
    category: '人像',
    template: '{subject} in a {scene}. {lighting} creates a dramatic atmosphere. Shot with {camera}. The composition follows cinematic principles with careful attention to color grading and mood. {quality}. The image captures a moment of {mood} that draws the viewer into the narrative.',
    description: 'Flux 自然语言长Prompt',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-flux-realistic-01',
    name: 'Flux 写实摄影',
    platform: 'flux',
    style: 'realistic',
    category: '摄影',
    template: 'A photorealistic image of {subject}. Set in {scene}. {lighting}. {camera}. The textures and materials are rendered with extreme precision. {quality}. Every detail is crisp and lifelike, from the subtle skin textures to the environmental elements.',
    description: 'Flux 写实摄影',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-flux-anime-01',
    name: 'Flux 动漫',
    platform: 'flux',
    style: 'anime',
    category: '动漫',
    template: '{subject} in an anime art style. The scene takes place in {scene}. {lighting} adds depth to the composition. {camera}. The artwork features vibrant colors and clean line art typical of high-quality anime production. {quality}.',
    description: 'Flux 动漫风格',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-flux-fantasy-01',
    name: 'Flux 奇幻',
    platform: 'flux',
    style: 'fantasy',
    category: '场景',
    template: '{subject} in a magical realm. {scene}. {lighting} creates an ethereal atmosphere. {camera}. The scene is filled with wonder and mysticism. {quality}. Floating particles and magical elements dance through the air.',
    description: 'Flux 奇幻风格',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-flux-cyberpunk-01',
    name: 'Flux 赛博朋克',
    platform: 'flux',
    style: 'cyberpunk',
    category: '场景',
    template: '{subject} in a neon-lit cyberpunk dystopia. {scene}. {lighting} casts colorful reflections on every surface. {camera}. The city is alive with holographic displays and flickering advertisements. {quality}.',
    description: 'Flux 赛博朋克',
    aspectRatio: '16:9',
  },

  // ===== SDXL 模板 =====
  {
    id: 'tpl-sdxl-cinematic-01',
    name: 'SDXL 电影人像',
    platform: 'stable-diffusion',
    style: 'cinematic',
    category: '人像',
    template: '{subject}, {scene}, {lighting}, {camera}, cinematic composition, anamorphic lens, 85mm f/1.4, {quality}, masterpiece, best quality, highly detailed, sharp focus, film grain, 8k',
    description: 'SDXL 电影人像 (含 Negative Prompt)',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-sdxl-realistic-01',
    name: 'SDXL 超写实',
    platform: 'stable-diffusion',
    style: 'realistic',
    category: '人像',
    template: '{subject}, {scene}, {lighting}, {camera}, photorealistic, hyper realistic, subsurface scattering, skin pore detail, {quality}, masterpiece, best quality, highly detailed, 8k, sharp focus, award-winning photography',
    description: 'SDXL 超写实 (含 Negative Prompt)',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-sdxl-anime-01',
    name: 'SDXL 动漫',
    platform: 'stable-diffusion',
    style: 'anime',
    category: '动漫',
    template: '{subject}, {scene}, {lighting}, {camera}, anime style, vibrant colors, cel shading, clean line art, detailed background, {quality}, masterpiece, best quality',
    description: 'SDXL 动漫风格',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-sdxl-cyberpunk-01',
    name: 'SDXL 赛博朋克',
    platform: 'stable-diffusion',
    style: 'cyberpunk',
    category: '场景',
    template: '{subject}, {scene}, {lighting}, {camera}, cyberpunk, neon lights, futuristic city, dark atmosphere, rain-slicked streets, holographic displays, {quality}, masterpiece, best quality, highly detailed',
    description: 'SDXL 赛博朋克',
    aspectRatio: '16:9',
  },

  // ===== 即梦 模板 =====
  {
    id: 'tpl-jimeng-cinematic-01',
    name: '即梦 电影感',
    platform: 'jimeng',
    style: 'cinematic',
    category: '人像',
    template: '{subject}，{scene}，{lighting}，{camera}，电影感构图，精美画质，{quality}',
    description: '即梦专用中文模板',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-jimeng-realistic-01',
    name: '即梦 写实人像',
    platform: 'jimeng',
    style: 'realistic',
    category: '人像',
    template: '{subject}，{scene}，{lighting}，{camera}，超写实风格，细腻肤质，毛发细节，{quality}，专业摄影',
    description: '即梦写实人像',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-jimeng-anime-01',
    name: '即梦 动漫',
    platform: 'jimeng',
    style: 'anime',
    category: '动漫',
    template: '{subject}，{scene}，{lighting}，{camera}，动漫风格，鲜艳色彩，精致线稿，{quality}',
    description: '即梦动漫风格',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-jimeng-fantasy-01',
    name: '即梦 仙侠',
    platform: 'jimeng',
    style: 'fantasy',
    category: '场景',
    template: '{subject}，{scene}，{lighting}，{camera}，仙气飘飘，云雾缭绕，光效粒子，{quality}',
    description: '即梦仙侠风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-jimeng-cyberpunk-01',
    name: '即梦 赛博朋克',
    platform: 'jimeng',
    style: 'cyberpunk',
    category: '场景',
    template: '{subject}，{scene}，{lighting}，{camera}，赛博朋克，霓虹灯，未来城市，{quality}',
    description: '即梦赛博朋克',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-jimeng-watercolor-01',
    name: '即梦 水彩',
    platform: 'jimeng',
    style: 'watercolor',
    category: '艺术',
    template: '{subject}，{scene}，{lighting}，{camera}，水彩画风，柔和边缘，流淌色彩，{quality}',
    description: '即梦水彩风格',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-jimeng-3d-01',
    name: '即梦 3D',
    platform: 'jimeng',
    style: '3d-render',
    category: '3D',
    template: '{subject}，{scene}，{lighting}，{camera}，3D渲染，精致模型，真实光影，{quality}',
    description: '即梦3D渲染',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-jimeng-vintage-01',
    name: '即梦 复古',
    platform: 'jimeng',
    style: 'vintage',
    category: '摄影',
    template: '{subject}，{scene}，{lighting}，{camera}，复古风格，胶片质感，暖色调，{quality}',
    description: '即梦复古风格',
    aspectRatio: '3:4',
  },

  // ===== 可灵 模板 =====
  {
    id: 'tpl-keling-cinematic-01',
    name: '可灵 电影感',
    platform: 'keling',
    style: 'cinematic',
    category: '视频',
    template: 'cinematic shot of {subject}, {scene}, {lighting}, {camera}, slow camera movement, film grain, 24fps, anamorphic lens, {quality}, masterpiece, best quality',
    description: '可灵视频生成，含镜头运动',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-keling-realistic-01',
    name: '可灵 写实',
    platform: 'keling',
    style: 'realistic',
    category: '视频',
    template: 'photorealistic video of {subject}, {scene}, {lighting}, {camera}, smooth camera motion, detailed textures, {quality}, 8k, cinematic',
    description: '可灵写实视频',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-keling-fantasy-01',
    name: '可灵 奇幻',
    platform: 'keling',
    style: 'fantasy',
    category: '视频',
    template: 'fantasy video of {subject}, {scene}, {lighting}, {camera}, floating particles, magical effects, slow camera orbit, {quality}, masterpiece, cinematic',
    description: '可灵奇幻视频',
    aspectRatio: '16:9',
  },
  {
    id: 'tpl-keling-anime-01',
    name: '可灵 动漫',
    platform: 'keling',
    style: 'anime',
    category: '视频',
    template: 'anime style video of {subject}, {scene}, {lighting}, {camera}, dynamic camera movement, vibrant colors, {quality}, masterpiece',
    description: '可灵动漫视频',
    aspectRatio: '16:9',
  },

  // ===== DALL·E 模板 =====
  {
    id: 'tpl-dalle-cinematic-01',
    name: 'DALL·E 电影感',
    platform: 'dalle',
    style: 'cinematic',
    category: '人像',
    template: 'A cinematic photograph of {subject}. The scene is set in {scene}. {lighting}. {camera}. The image has a film-like quality with rich colors and dramatic composition. {quality}.',
    description: 'DALL·E 3 自然语言',
    aspectRatio: '3:4',
  },
  {
    id: 'tpl-dalle-realistic-01',
    name: 'DALL·E 写实',
    platform: 'dalle',
    style: 'realistic',
    category: '人像',
    template: 'A highly realistic photograph of {subject}. The setting is {scene}. {lighting}. {camera}. The image is sharp and detailed, with natural skin textures and lifelike colors. {quality}.',
    description: 'DALL·E 3 写实',
    aspectRatio: '2:3',
  },
  {
    id: 'tpl-dalle-anime-01',
    name: 'DALL·E 动漫',
    platform: 'dalle',
    style: 'anime',
    category: '动漫',
    template: 'An anime-style illustration of {subject}. The setting is {scene}. {lighting}. {camera}. The art style is reminiscent of Japanese animation with vibrant colors and clean lines. {quality}.',
    description: 'DALL·E 3 动漫',
    aspectRatio: '2:3',
  },
]

// ==================== 模板存储 ====================

let templateStore: PromptTemplate[] = [...defaultTemplates]

// 加载/保存辅助函数
function getStoreKey(): string {
  return 'prompt_templates'
}

export function loadTemplates(): PromptTemplate[] {
  try {
    if (typeof window === 'undefined') {
      // 服务端：从全局变量读取
      if ((globalThis as any).__templateStore) {
        templateStore = (globalThis as any).__templateStore
      }
    }
  } catch {
    // ignore
  }
  return templateStore
}

export function saveTemplates(): void {
  try {
    if (typeof window === 'undefined') {
      (globalThis as any).__templateStore = templateStore
    }
  } catch {
    // ignore
  }
}

// ==================== 模板 API ====================

/** 生成唯一 ID */
function generateId(): string {
  return 'tpl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/** 获取所有模板 */
export function getAllTemplates(): PromptTemplate[] {
  return [...templateStore]
}

/** 按平台获取模板 */
export function getTemplatesByPlatform(platform: string): PromptTemplate[] {
  return templateStore.filter((t) => t.platform === platform)
}

/** 按风格获取模板 */
export function getTemplatesByStyle(style: string): PromptTemplate[] {
  return templateStore.filter((t) => t.style === style)
}

/** 按平台和风格获取模板 */
export function getTemplatesByPlatformAndStyle(platform: string, style: string): PromptTemplate[] {
  return templateStore.filter((t) => t.platform === platform && t.style === style)
}

/** 随机获取一个模板 */
export function getRandomTemplate(platform: string, style: string): PromptTemplate | null {
  const candidates = getTemplatesByPlatformAndStyle(platform, style)
  if (candidates.length === 0) {
    // 回退：只看风格
    const styleOnly = getTemplatesByStyle(style)
    if (styleOnly.length === 0) return null
    return styleOnly[Math.floor(Math.random() * styleOnly.length)]
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** 获取模板分类列表 */
export function getTemplateCategories(): { id: string; name: string; label: string; count: number }[] {
  const catMap = new Map<string, number>()
  templateStore.forEach((t) => {
    catMap.set(t.category, (catMap.get(t.category) || 0) + 1)
  })
  return Array.from(catMap.entries()).map(([name, count]) => ({
    id: name,
    name,
    label: name,
    count,
  }))
}

/** 创建模板 */
export function createTemplate(data: Omit<PromptTemplate, 'id' | 'created_at' | 'useCount'>): PromptTemplate {
  const template: PromptTemplate = {
    ...data,
    id: generateId(),
    useCount: 0,
    created_at: new Date().toISOString(),
  }
  templateStore.unshift(template)
  saveTemplates()
  return template
}

/** 更新模板 */
export function updateTemplate(id: string, data: Partial<Omit<PromptTemplate, 'id' | 'created_at'>>): PromptTemplate | null {
  const idx = templateStore.findIndex((t) => t.id === id)
  if (idx === -1) return null
  templateStore[idx] = { ...templateStore[idx], ...data, updated_at: new Date().toISOString() }
  saveTemplates()
  return templateStore[idx]
}

/** 删除模板 */
export function deleteTemplate(id: string): boolean {
  const idx = templateStore.findIndex((t) => t.id === id)
  if (idx === -1) return false
  templateStore.splice(idx, 1)
  saveTemplates()
  return true
}

/** 记录模板使用 */
export function recordTemplateUse(id: string): void {
  const tpl = templateStore.find((t) => t.id === id)
  if (tpl) {
    tpl.useCount = (tpl.useCount || 0) + 1
    saveTemplates()
  }
}

/** 导入模板 */
export function importTemplates(templates: PromptTemplate[]): number {
  let count = 0
  templates.forEach((t) => {
    // 避免重复导入
    const exists = templateStore.find((e) => e.id === t.id)
    if (!exists) {
      templateStore.unshift({ ...t, useCount: 0, created_at: new Date().toISOString() })
      count++
    }
  })
  saveTemplates()
  return count
}

/** 导出模板 */
export function exportTemplates(platform?: string): PromptTemplate[] {
  if (platform) return getTemplatesByPlatform(platform)
  return getAllTemplates()
}

/** 重置为默认模板 */
export function resetToDefaults(): void {
  templateStore = [...defaultTemplates]
  saveTemplates()
}

// ==================== 模板变量替换 ====================

/** 占位符替换映射 */
interface PlaceholderValues {
  subject: string
  scene?: string
  lighting?: string
  camera?: string
  quality?: string
  style?: string
  mood?: string
  details?: string
}

/** 默认值映射 */
const defaultValues: Record<string, Record<string, string>> = {
  scene: {
    cinematic: 'in a dramatic film set with atmospheric lighting',
    anime: 'in a vibrant anime world',
    realistic: 'in a professional photography studio',
    cyberpunk: 'in a neon-lit futuristic city',
    fantasy: 'in an enchanted magical realm',
    watercolor: 'in a dreamy watercolor landscape',
    '3d-render': 'in a hyper-realistic 3D environment',
    noir: 'in a shadowy film noir setting',
    vintage: 'in a nostalgic retro setting',
    comic: 'in a dynamic comic book panel',
    surreal: 'in a surreal dreamscape',
    gothic: 'in a haunting gothic cathedral',
    minimal: 'in a clean minimalist space',
    'oil-painting': 'in a classical painting composition',
    'pixel-art': 'in a retro pixel art world',
    sketch: 'in a hand-drawn sketchbook',
  },
  lighting: {
    cinematic: 'cinematic lighting with dramatic shadows and soft rim light',
    backlight: 'golden backlighting creating a stunning silhouette effect',
    soft: 'soft diffused lighting with gentle shadows',
    volumetric: 'volumetric lighting with visible god rays',
    neon: 'vibrant neon lighting with colorful reflections',
    moonlight: 'cool moonlight casting ethereal blue tones',
    default: 'cinematic lighting with dramatic shadows and soft rim light',
  },
  camera: {
    'close-up': 'close-up shot with shallow depth of field, 85mm f/1.4',
    portrait: 'portrait shot, 85mm f/1.4, chest-up framing',
    'full-body': 'full body shot, 50mm f/1.8, environmental portrait',
    'wide-angle': 'wide angle shot, 24mm f/2.8, expansive view',
    'bird-view': 'bird eye view, aerial perspective, drone shot',
    pov: 'POV shot, first person perspective, immersive',
    aerial: 'aerial shot, drone photography, sweeping landscape',
    default: 'portrait shot, 85mm f/1.4, cinematic composition',
  },
  quality: {
    standard: 'high quality',
    high: 'ultra detailed, 8k resolution',
    master: 'masterpiece, best quality, ultra detailed, 8k, award-winning',
    default: 'ultra detailed, 8k resolution',
  },
}

/**
 * 替换模板中的占位符
 */
export function replacePlaceholders(template: string, values: PlaceholderValues, style: string = 'cinematic'): string {
  let result = template

  // 主体（必填）
  result = result.replace(/\{subject\}/g, values.subject)

  // 场景
  const scene = values.scene || defaultValues.scene[style] || defaultValues.scene['cinematic']
  result = result.replace(/\{scene\}/g, scene)

  // 光影
  const lighting = values.lighting
    ? (defaultValues.lighting[values.lighting] || defaultValues.lighting.default)
    : (defaultValues.lighting.default)
  result = result.replace(/\{lighting\}/g, lighting)

  // 镜头
  const camera = values.camera
    ? (defaultValues.camera[values.camera] || defaultValues.camera.default)
    : (defaultValues.camera.default)
  result = result.replace(/\{camera\}/g, camera)

  // 画质
  const quality = values.quality
    ? (defaultValues.quality[values.quality] || defaultValues.quality.default)
    : (defaultValues.quality.default)
  result = result.replace(/\{quality\}/g, quality)

  // 风格
  if (values.style) result = result.replace(/\{style\}/g, values.style)
  else result = result.replace(/\{style\}/g, '')

  // 情绪
  if (values.mood) result = result.replace(/\{mood\}/g, values.mood)
  else result = result.replace(/\{mood\}/g, '')

  // 额外细节
  if (values.details) result = result.replace(/\{details\}/g, values.details)
  else result = result.replace(/\{details\}/g, '')

  // 清理多余空格和逗号
  result = result.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').trim()

  return result
}