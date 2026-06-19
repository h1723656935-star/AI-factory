// @ts-nocheck
// ============================================================
// Prompt 知识库 — 专业级 AI 绘图提示词知识体系
// 用于 prompt 管道式生成引擎的智能增强
// ============================================================

// ---------- 人物库 ----------
export const personLibrary: Record<string, {
  face: string[]
  skin: string[]
  hair: string[]
  body: string[]
  clothing: string[]
  expression: string[]
  pose: string[]
}> = {
  '亚洲女性': {
    face: ['delicate facial features', 'gentle eyes', 'soft smile', 'flawless complexion', 'natural makeup', 'arched eyebrows'],
    skin: ['realistic skin texture', 'smooth skin', 'subsurface scattering', 'pore-level detail', 'healthy glow', 'natural skin tone'],
    hair: ['silky black hair', 'flowing strands', 'glossy hair', 'natural hair movement', 'detailed hair strands'],
    body: ['elegant posture', 'slender figure', 'graceful proportions', 'feminine silhouette'],
    clothing: ['traditional Chinese dress', 'flowing silk fabric', 'intricate embroidery', 'delicate accessories'],
    expression: ['gentle gaze', 'subtle smile', 'serene expression', 'warm eyes', 'thoughtful look'],
    pose: ['graceful standing pose', 'elegant hand gesture', 'slight head tilt', 'natural posture'],
  },
  '亚洲男性': {
    face: ['sharp jawline', 'defined features', 'expressive eyes', 'clean shaven', 'chiseled face'],
    skin: ['realistic skin texture', 'pore-level detail', 'natural complexion', 'subtle skin imperfections'],
    hair: ['styled dark hair', 'natural hair texture', 'clean hairstyle'],
    body: ['athletic build', 'broad shoulders', 'well-proportioned', 'masculine silhouette'],
    clothing: ['modern streetwear', 'tailored suit', 'traditional Chinese robe', 'martial arts uniform'],
    expression: ['confident gaze', 'determined expression', 'calm demeanor', 'intense stare'],
    pose: ['powerful stance', 'dynamic action pose', 'relaxed posture', 'martial arts stance'],
  },
  '西方女性': {
    face: ['striking features', 'defined cheekbones', 'captivating eyes', 'full lips', 'flawless makeup'],
    skin: ['porcelain skin', 'natural skin texture', 'freckles', 'sun-kissed glow', 'dewy complexion'],
    hair: ['blonde wavy hair', 'flowing golden locks', 'voluminous curls', 'braided hairstyle'],
    body: ['athletic physique', 'toned figure', 'model proportions'],
    clothing: ['elegant evening gown', 'high fashion outfit', 'casual chic', 'designer clothing'],
    expression: ['captivating smile', 'mysterious gaze', 'confident look', 'playful expression'],
    pose: ['fashion model pose', 'natural walking pose', 'dramatic pose'],
  },
  '西方男性': {
    face: ['strong jawline', 'piercing eyes', 'well-groomed beard', 'chiseled features', 'handsome face'],
    skin: ['weathered skin texture', 'rugged complexion', 'natural skin details'],
    hair: ['textured brown hair', 'short styled hair', 'windswept look'],
    body: ['muscular build', 'tall stature', 'V-shaped torso', 'athletic physique'],
    clothing: ['tailored three-piece suit', 'casual leather jacket', 'military uniform', 'fantasy armor'],
    expression: ['intense stare', 'brooding look', 'heroic expression', 'stoic demeanor'],
    pose: ['heroic stance', 'action-ready pose', 'contemplative pose', 'power pose'],
  },
  '儿童': {
    face: ['innocent eyes', 'chubby cheeks', 'bright smile', 'button nose', 'youthful glow'],
    skin: ['soft baby skin', 'smooth complexion', 'natural blush', 'peach-like skin'],
    hair: ['soft fine hair', 'messy playful hair', 'cute pigtails'],
    body: ['small stature', 'adorable proportions', 'playful posture'],
    clothing: ['colorful casual wear', 'traditional festive outfit', 'cute costume'],
    expression: ['joyful laughter', 'curious gaze', 'innocent smile', 'playful expression'],
    pose: ['playful running', 'sitting cross-legged', 'curious reaching', 'happy jumping'],
  },
  '老人': {
    face: ['wisdom lines', 'kind eyes', 'weathered face', 'character wrinkles', 'gentle smile'],
    skin: ['aged skin texture', 'natural wrinkles', 'age spots', 'leathery texture'],
    hair: ['silver gray hair', 'white beard', 'receding hairline'],
    body: ['slightly hunched', 'frail frame', 'weathered hands'],
    clothing: ['traditional robes', 'simple comfortable clothing', 'scholarly attire'],
    expression: ['wise smile', 'knowing gaze', 'peaceful expression', 'benevolent look'],
    pose: ['seated meditation', 'staff in hand', 'scholarly reading', 'walking with cane'],
  },
  '奇幻角色': {
    face: ['ethereal features', 'glowing eyes', 'elven ears', 'mystical markings', 'otherworldly beauty'],
    skin: ['luminescent skin', 'scale texture', 'magical rune tattoos', 'crystalline surface'],
    hair: ['flowing magical hair', 'elemental hair', 'cosmic hair strands'],
    body: ['heroic proportions', 'winged figure', 'elemental form'],
    clothing: ['enchanted armor', 'mage robes', 'divine garments', 'dragon scale armor'],
    expression: ['ancient wisdom', 'fierce determination', 'mystical gaze'],
    pose: ['spellcasting stance', 'heroic battle pose', 'floating meditation'],
  },
}

// ---------- 摄影库 ----------
export const photographyLibrary: Record<string, string[]> = {
  'portrait': ['85mm lens', 'f/1.4 aperture', 'shallow depth of field', 'cinematic composition', 'bokeh background', 'three-quarter angle', 'eye-level shot'],
  'close-up': ['100mm macro lens', 'f/2.8', 'extreme detail', 'shallow depth of field', 'intimate framing', 'facial texture visible'],
  'full-body': ['50mm lens', 'f/2.8', 'full body composition', 'fashion photography style', 'environmental context', 'dynamic stance'],
  'wide': ['24mm wide angle lens', 'f/8', 'deep depth of field', 'environmental storytelling', 'leading lines', 'rule of thirds'],
  'aerial': ['drone shot', 'bird\'s eye view', 'aerial perspective', 'wide angle', 'top-down composition', 'sweeping vista'],
  'action': ['70-200mm telephoto', 'f/2.8', 'fast shutter speed', 'motion freeze', 'dynamic composition', 'action sports photography'],
  'cinematic': ['anamorphic lens', '2.35:1 aspect ratio', 'film grain', 'Kodak Portra 400', 'cinematic color grading', 'director\'s viewfinder'],
  'documentary': ['35mm lens', 'f/4', 'natural light', 'photojournalism style', 'candid moment', 'environmental portrait'],
  'macro': ['100mm macro lens', 'f/2.8', '1:1 magnification', 'extreme close-up', 'insect eye detail', 'water droplet refraction'],
  'night': ['50mm f/1.2', 'long exposure', 'tripod shot', 'city lights bokeh', 'night photography', 'low light mastery'],
}

// ---------- 光影库 ----------
export const lightingLibrary: Record<string, string[]> = {
  'cinematic': ['cinematic lighting', 'three-point lighting', 'dramatic shadows', 'rim light', 'golden hour', 'soft key light', 'fill light', 'backlight hair light'],
  'rim': ['rim lighting', 'edge light', 'backlit silhouette', 'halo effect', 'contre-jour', 'hair light glow'],
  'soft': ['soft diffused lighting', 'overcast sky', 'window light', 'butterfly lighting', 'Rembrandt lighting', 'fill light only', 'gentle shadows'],
  'volumetric': ['volumetric lighting', 'god rays', 'crepuscular rays', 'atmospheric light', 'fog illumination', 'dust particles in light', 'smoke haze'],
  'neon': ['neon lighting', 'cyberpunk glow', 'fluorescent tubes', 'colored gel lights', 'night club aesthetic', 'pink and blue lighting', 'LED strips'],
  'moonlight': ['moonlight', 'night scene', 'cool blue tones', 'silver illumination', 'ethereal glow', 'starry night', 'nocturnal atmosphere'],
  'golden': ['golden hour', 'warm sunset light', 'orange glow', 'long shadows', 'warm color temperature', 'late afternoon sun'],
  'dramatic': ['chiaroscuro lighting', 'high contrast', 'deep shadows', 'single light source', 'noir lighting', 'dramatic spotlight', 'stage lighting'],
  'studio': ['professional studio lighting', 'softbox', 'beauty dish', 'strip light', 'product photography lighting', 'seamless background', 'key light plus fill'],
  'natural': ['natural window light', 'ambient light', 'golden hour', 'open shade', 'reflector fill', 'environmental light'],
}

// ---------- 画质库 ----------
export const qualityLibrary: Record<string, string[]> = {
  'standard': ['detailed', 'high resolution', 'sharp focus'],
  'high': ['masterpiece', 'best quality', 'highly detailed', 'sharp focus', 'professional lighting'],
  'master': ['masterpiece', 'best quality', 'ultra detailed', '8k', 'award-winning photography', 'professional photography', 'hyper-realistic', 'intricate details', 'crisp quality', 'high resolution'],
  'ultra': ['masterpiece', 'best quality', 'ultra detailed', '8k', '16k', 'award-winning', 'photorealistic', 'hyper-realistic', 'intricate details', 'crisp quality', 'professional photography', 'magazine quality', 'gallery worthy'],
}

// ---------- 材质库 ----------
export const materialLibrary: Record<string, string[]> = {
  'skin': ['realistic skin texture', 'subsurface scattering', 'pore-level detail', 'skin imperfections', 'micro detail', 'natural skin translucency'],
  'fabric': ['silk fabric sheen', 'cotton texture', 'wool fibers', 'velvet softness', 'linen weave', 'leather grain', 'transparent chiffon', 'brocade pattern'],
  'metal': ['polished metal reflection', 'brushed aluminum', 'tarnished copper', 'gold luster', 'chrome finish', 'rusted iron texture', 'forged steel'],
  'wood': ['wood grain texture', 'oak grain', 'polished mahogany', 'weathered wood', 'bamboo texture', 'cedar wood pattern'],
  'stone': ['marble veining', 'granite speckle', 'sandstone texture', 'weathered rock', 'jade translucency', 'obsidian glass',
  'crystal clear'],
  'glass': ['crystal glass reflection', 'frosted glass', 'stained glass', 'glass refraction', 'transparent glass', 'broken glass shards'],
  'water': ['water surface reflection', 'underwater caustics', 'rippling water', 'crystal clear water', 'ocean waves', 'water droplets'],
  'nature': ['moss texture', 'bark grain', 'petal softness', 'leaf veins', 'grass blades', 'sand grains', 'snow crystalline'],
  'food': ['food texture', 'steam rising', 'sauce glaze', 'crispy texture', 'juicy interior', 'fresh ingredients'],
  'tech': ['carbon fiber weave', 'matte plastic', 'glass screen reflection', 'circuit board detail', 'LED glow', 'holographic display'],
}

// ---------- 色彩库 ----------
export const colorLibrary: Record<string, { palette: string[]; description: string }> = {
  'warm': { palette: ['warm golden tones', 'amber', 'orange', 'crimson', 'terracotta', 'peach'], description: '温暖色调，金色和琥珀色为主' },
  'cool': { palette: ['cool blue tones', 'teal', 'cyan', 'silver', 'ice blue', 'lavender'], description: '冷色调，蓝色和青色为主' },
  'monochrome': { palette: ['black and white', 'grayscale', 'high contrast', 'silver tones', 'charcoal'], description: '黑白单色，高对比度' },
  'vintage': { palette: ['sepia tone', 'faded colors', 'warm yellow', 'muted brown', 'vintage wash', 'film color'], description: '复古色调，怀旧感' },
  'cyberpunk': { palette: ['neon pink', 'cyan blue', 'purple', 'magenta', 'electric blue', 'synthetic green'], description: '赛博朋克霓虹色' },
  'pastel': { palette: ['soft pink', 'baby blue', 'mint green', 'lavender', 'peach', 'cream'], description: '柔和粉彩，清新温柔' },
  'earthy': { palette: ['olive green', 'terracotta', 'sand', 'clay', 'forest green', 'umber'], description: '大地色系，自然质感' },
  'jewel': { palette: ['emerald green', 'sapphire blue', 'ruby red', 'amethyst purple', 'topaz yellow'], description: '宝石色调，浓烈奢华' },
  'noir': { palette: ['deep blacks', 'dark grays', 'silver highlights', 'moody blues', 'shadow tones'], description: '暗黑色调，电影感' },
  'ethereal': { palette: ['pearlescent white', 'iridescent', 'holographic', 'opal', 'soft glow', 'angelic light'], description: '空灵梦幻，珠光质感' },
}

// ---------- 场景库 ----------
export const sceneLibrary: Record<string, string[]> = {
  'indoor': ['cozy interior', 'warm ambient lighting', 'homey atmosphere', 'furniture details', 'indoor plants', 'window light'],
  'outdoor': ['natural landscape', 'open sky', 'environmental context', 'natural elements', 'weather effects', 'seasonal setting'],
  'urban': ['city street', 'modern architecture', 'urban landscape', 'street photography', 'city lights', 'metropolitan vibe'],
  'nature': ['lush forest', 'mountain range', 'flowing river', 'wildflower meadow', 'ancient trees', 'natural wonder'],
  'studio': ['professional photo studio', 'clean backdrop', 'controlled lighting', 'minimal setup', 'product photography setup'],
  'fantasy': ['enchanted forest', 'floating islands', 'magical realm', 'crystal cave', 'ancient ruins', 'mystical portal'],
  'cyberpunk': ['neon-lit alley', 'futuristic cityscape', 'holographic billboards', 'rain-slicked streets', 'cyberpunk megacity', 'dystopian future'],
  'historical': ['ancient Chinese palace', 'traditional courtyard', 'historical architecture', 'period-accurate details', 'cultural heritage'],
  'beach': ['sandy beach', 'ocean waves', 'tropical paradise', 'palm trees', 'sunset beach', 'crystal clear water'],
  'winter': ['snow-covered landscape', 'frost atmosphere', 'winter wonderland', 'ice crystals', 'northern lights', 'cozy winter cabin'],
}

// ---------- 辅助函数 ----------

/** 从知识库中随机选择 N 个元素 */
export function pickFromLibrary(lib: string[], count: number): string[] {
  const shuffled = [...lib].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/** 根据关键词智能匹配人物库 */
export function matchPerson(subject: string): string[] {
  const keywords: string[] = []
  const lower = subject.toLowerCase()

  for (const [key, data] of Object.entries(personLibrary)) {
    if (lower.includes(key.toLowerCase()) || lower.includes(key.slice(0, 2))) {
      keywords.push(...data.face.slice(0, 3))
      keywords.push(...data.skin.slice(0, 2))
      keywords.push(...data.hair.slice(0, 2))
      keywords.push(...data.expression.slice(0, 2))
      keywords.push(...data.pose.slice(0, 2))
      break
    }
  }

  // 通用匹配
  if (keywords.length === 0) {
    if (lower.includes('woman') || lower.includes('girl') || lower.includes('女性') || lower.includes('女') || lower.includes('美女')) {
      const data = personLibrary['亚洲女性']
      keywords.push(...data.face.slice(0, 3), ...data.skin.slice(0, 2), ...data.hair.slice(0, 2))
    } else if (lower.includes('man') || lower.includes('boy') || lower.includes('男性') || lower.includes('男')) {
      const data = personLibrary['亚洲男性']
      keywords.push(...data.face.slice(0, 3), ...data.skin.slice(0, 2), ...data.hair.slice(0, 2))
    }
  }

  return keywords
}

/** 匹配摄影关键词 */
export function matchPhotography(camera: string): string[] {
  return photographyLibrary[camera] || photographyLibrary['portrait']
}

/** 匹配光影关键词 */
export function matchLighting(lighting: string): string[] {
  return lightingLibrary[lighting] || lightingLibrary['cinematic']
}

/** 匹配画质关键词 */
export function matchQuality(quality: string): string[] {
  return qualityLibrary[quality] || qualityLibrary['high']
}

/** 匹配色彩方案 */
export function matchColor(mood?: string): string[] {
  const moodToColor: Record<string, string> = {
    'dreamy': 'ethereal', 'mysterious': 'noir', 'oppressive': 'noir',
    'warm': 'warm', 'lonely': 'cool', 'epic': 'jewel',
  }
  const colorKey = mood ? (moodToColor[mood] || 'warm') : 'warm'
  return colorLibrary[colorKey]?.palette || colorLibrary['warm'].palette
}