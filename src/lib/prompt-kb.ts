// @ts-nocheck
// ============================================================
// Prompt 知识库 — 主体驱动型 AI 绘图提示词引擎
// 核心原则：主体决定内容，风格负责增强
// ============================================================

// ---------- 主体类型定义 ----------
export type SubjectType = 'person' | 'clothing' | 'product' | 'animal' | 'architecture' | 'scene' | 'vehicle' | 'food'

export interface SubjectCategory {
  type: SubjectType
  label: string
  labelCn: string
  keywords: string[]
  coreAttributes: string[]
  descriptionPatterns: string[]
}

// ---------- 主体类型识别 ----------
export const subjectCategories: SubjectCategory[] = [
  {
    type: 'person',
    label: 'Person',
    labelCn: '人物',
    keywords: ['人', '人物', '男', '女', '老人', '儿童', '美女', '帅哥', '模特', '演员', '角色', '人物', 'person', 'man', 'woman', 'girl', 'boy', 'people', 'human', 'character', 'model'],
    coreAttributes: ['外观描述', '表情神态', '动作姿态', '服装配饰'],
    descriptionPatterns: [
      'a {age} {ethnicity} {gender} with {feature}',
      'the subject is {description}',
      '{subject} in {pose} pose',
    ],
  },
  {
    type: 'clothing',
    label: 'Clothing',
    labelCn: '服装',
    keywords: ['服装', '衣服', '裙子', '裤子', '外套', '衬衫', '鞋子', '帽子', '包', '配饰', 'dress', 'shirt', 'pants', 'jacket', 'coat', 'shoes', 'hat', 'bag', 'clothing', 'fashion', 'outfit', 'garment'],
    coreAttributes: ['款式版型', '材质面料', '颜色图案', '细节做工'],
    descriptionPatterns: [
      '{material} {clothing_type} with {pattern}',
      'a {style} {garment} featuring {detail}',
      'elegant {clothing} made of {fabric}',
    ],
  },
  {
    type: 'product',
    label: 'Product',
    labelCn: '产品',
    keywords: ['产品', '商品', '手机', '电脑', '相机', '耳机', '手表', '首饰', '化妆品', 'product', 'phone', 'laptop', 'camera', 'watch', 'jewelry', 'cosmetic', 'electronics', 'gadget', 'item'],
    coreAttributes: ['外观造型', '功能特点', '材质质感', '使用场景'],
    descriptionPatterns: [
      '{brand} {product_type} with {feature}',
      'a sleek {product} displayed on {background}',
      'professional {product} photography',
    ],
  },
  {
    type: 'animal',
    label: 'Animal',
    labelCn: '动物',
    keywords: ['动物', '猫', '狗', '鸟', '鱼', '马', '狮子', '老虎', '兔子', '动物', 'animal', 'cat', 'dog', 'bird', 'fish', 'horse', 'lion', 'tiger', 'rabbit', 'pet', 'wildlife'],
    coreAttributes: ['物种特征', '皮毛质感', '神态动作', '生态环境'],
    descriptionPatterns: [
      'a {species} {color} with {feature}',
      '{animal} in its natural {environment}',
      'beautiful {pet_type} with {detail}',
    ],
  },
  {
    type: 'architecture',
    label: 'Architecture',
    labelCn: '建筑',
    keywords: ['建筑', '房子', '大楼', '桥梁', '教堂', '宫殿', '塔', '建筑', 'architecture', 'building', 'house', 'bridge', 'church', 'palace', 'tower', 'structure', 'construction'],
    coreAttributes: ['建筑风格', '结构特点', '材质质感', '光影氛围'],
    descriptionPatterns: [
      '{style} {building_type} with {feature}',
      'a magnificent {structure} in {setting}',
      '{material} {architecture} featuring {detail}',
    ],
  },
  {
    type: 'scene',
    label: 'Scene',
    labelCn: '场景',
    keywords: ['场景', '风景', '风景', '城市', '乡村', '海滩', '森林', '夜景', 'scene', 'landscape', 'view', 'cityscape', 'countryside', 'beach', 'forest', 'night view', 'setting'],
    coreAttributes: ['场景类型', '空间层次', '天气光效', '氛围情绪'],
    descriptionPatterns: [
      '{time} {location} with {atmosphere}',
      'a breathtaking {scene} featuring {element}',
      '{weather} {setting} with {lighting}',
    ],
  },
  {
    type: 'vehicle',
    label: 'Vehicle',
    labelCn: '载具',
    keywords: ['汽车', '摩托车', '飞机', '火车', '船', '自行车', '载具', 'vehicle', 'car', 'motorcycle', 'airplane', 'train', 'ship', 'bicycle', 'transport'],
    coreAttributes: ['车型外观', '品牌风格', '动态静态', '使用场景'],
    descriptionPatterns: [
      'a {brand} {vehicle_type} {color}',
      'vintage {car} in {setting}',
      '{vehicle} showcasing {feature}',
    ],
  },
  {
    type: 'food',
    label: 'Food',
    labelCn: '食物',
    keywords: ['食物', '美食', '蛋糕', '咖啡', '甜点', '料理', '食物', 'food', 'cake', 'coffee', 'dessert', 'cuisine', 'meal', 'dish', 'cooking'],
    coreAttributes: ['食物种类', '外观色泽', '质感层次', '呈现方式'],
    descriptionPatterns: [
      'a delicious {food_type} with {topping}',
      'gourmet {dish} plated on {plate}',
      'appetizing {food} with {garnish}',
    ],
  },
]

// 识别主体类型
export function detectSubjectType(subject: string): SubjectType {
  const lower = subject.toLowerCase()
  
  for (const category of subjectCategories) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category.type
      }
    }
  }
  
  // 默认返回人物类型
  return 'person'
}

// 获取主体类型标签
export function getSubjectTypeLabel(type: SubjectType): { label: string; labelCn: string } {
  const category = subjectCategories.find(c => c.type === type)
  return {
    label: category?.label || 'Unknown',
    labelCn: category?.labelCn || '未知',
  }
}

// ---------- 主体描述模板库 ----------
interface SubjectTemplate {
  type: SubjectType
  baseDescription: (subject: string, details?: string) => string[]
  appearanceModifiers: string[]
  actionModifiers: string[]
  materialModifiers: string[]
}

const subjectTemplates: Record<SubjectType, SubjectTemplate> = {
  person: {
    type: 'person',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('女性') || subject.includes('女') || subject.includes('girl') || subject.includes('woman')) {
        descs.push('young Asian woman', 'beautiful female figure', 'elegant lady', 'charming woman')
      } else if (subject.includes('男性') || subject.includes('男') || subject.includes('boy') || subject.includes('man')) {
        descs.push('handsome Asian man', 'masculine figure', 'confident male', 'attractive man')
      } else if (subject.includes('儿童') || subject.includes('孩')) {
        descs.push('innocent child', 'cute little girl', 'cheerful boy', 'adorable kid')
      } else if (subject.includes('老人')) {
        descs.push('elderly person', 'wise older man', 'graceful senior', 'distinguished elder')
      } else {
        descs.push('person', 'individual', 'figure', 'character')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with delicate facial features', 'with sharp jawline', 'with gentle eyes',
      'wearing elegant attire', 'dressed in casual clothes', 'in traditional outfit',
      'with natural makeup', 'with confident expression', 'with serene smile',
    ],
    actionModifiers: [
      'standing gracefully', 'sitting thoughtfully', 'walking confidently',
      'looking into the distance', 'turning head slightly', 'posing for the camera',
      'engaged in activity', 'in contemplative moment', 'with relaxed posture',
    ],
    materialModifiers: [],
  },
  
  clothing: {
    type: 'clothing',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('裙子') || subject.includes('dress')) {
        descs.push('elegant dress', 'flowing gown', 'stylish dress', 'beautiful skirt')
      } else if (subject.includes('衬衫') || subject.includes('shirt')) {
        descs.push('classic shirt', 'crisp blouse', 'stylish top', 'fitted shirt')
      } else if (subject.includes('外套') || subject.includes('jacket')) {
        descs.push('fashionable jacket', 'stylish coat', 'elegant outerwear', 'trendy jacket')
      } else if (subject.includes('鞋') || subject.includes('shoe')) {
        descs.push('designer shoes', 'elegant heels', 'stylish sneakers', 'classic footwear')
      } else {
        descs.push('fashion item', 'stylish garment', 'elegant clothing piece', 'designer wear')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'made of fine silk', 'crafted from premium leather', 'featuring intricate embroidery',
      'with delicate lace details', 'in rich fabric', 'with elegant draping',
      'adorned with gems', 'featuring unique design', 'with flowing silhouette',
    ],
    actionModifiers: [],
    materialModifiers: [
      'silk fabric', 'cotton blend', 'wool material', 'linen texture',
      'leather finish', 'velvet touch', 'lace overlay', 'satin sheen',
    ],
  },
  
  product: {
    type: 'product',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('手机') || subject.includes('phone')) {
        descs.push('modern smartphone', 'sleek mobile device', 'latest flagship phone')
      } else if (subject.includes('电脑') || subject.includes('laptop')) {
        descs.push('ultrabook laptop', 'powerful computer', 'slim notebook')
      } else if (subject.includes('手表') || subject.includes('watch')) {
        descs.push('luxury timepiece', 'elegant watch', 'designer timepiece')
      } else if (subject.includes('首饰') || subject.includes('jewelry')) {
        descs.push('diamond necklace', 'gold bracelet', 'pearl earrings')
      } else {
        descs.push('premium product', 'high-end item', 'professional product')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with sleek design', 'featuring premium finish', 'in matte black',
      'with chrome accents', 'in minimalist style', 'with glossy surface',
      'with LED indicators', 'with precision engineering', 'in modern aesthetics',
    ],
    actionModifiers: [],
    materialModifiers: [
      'aluminum body', 'glass screen', 'carbon fiber', 'titanium frame',
      'ceramic finish', 'brushed metal', 'premium plastic', 'steel accents',
    ],
  },
  
  animal: {
    type: 'animal',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('猫') || subject.includes('cat')) {
        descs.push('fluffy cat', 'elegant feline', 'playful kitten', 'majestic cat')
      } else if (subject.includes('狗') || subject.includes('dog')) {
        descs.push('loyal dog', 'playful puppy', 'noble canine', 'friendly dog')
      } else if (subject.includes('鸟') || subject.includes('bird')) {
        descs.push('colorful bird', 'graceful avian', 'exotic bird', 'singing bird')
      } else if (subject.includes('马') || subject.includes('horse')) {
        descs.push('powerful horse', 'elegant stallion', 'noble steed', 'majestic horse')
      } else {
        descs.push('beautiful animal', 'wild creature', 'magnificent beast', 'wildlife')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with shiny coat', 'with striking patterns', 'with expressive eyes',
      'in natural habitat', 'with distinctive markings', 'with smooth fur',
      'with powerful build', 'with graceful posture', 'with wild spirit',
    ],
    actionModifiers: [
      'running freely', 'resting peacefully', 'hunting gracefully',
      'playing joyfully', 'grooming itself', 'looking alert',
      'exploring surroundings', 'interacting with nature', 'showcasing natural beauty',
    ],
    materialModifiers: [],
  },
  
  architecture: {
    type: 'architecture',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('房子') || subject.includes('house')) {
        descs.push('cozy house', 'modern residence', 'traditional dwelling', 'luxury home')
      } else if (subject.includes('大楼') || subject.includes('building')) {
        descs.push('skyscraper', 'modern building', 'glass tower', 'commercial structure')
      } else if (subject.includes('教堂') || subject.includes('church')) {
        descs.push('ancient cathedral', 'gothic church', 'historic chapel', 'magnificent church')
      } else if (subject.includes('桥') || subject.includes('bridge')) {
        descs.push('elegant bridge', 'ancient stone bridge', 'modern suspension bridge', 'architectural span')
      } else {
        descs.push('impressive structure', 'architectural masterpiece', 'stunning building', 'remarkable construction')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with intricate details', 'featuring classic design', 'in modern style',
      'with ornate decorations', 'with clean lines', 'in traditional style',
      'with impressive scale', 'with artistic elements', 'with historical significance',
    ],
    actionModifiers: [],
    materialModifiers: [
      'brick and mortar', 'concrete and glass', 'stone and marble',
      'wooden structure', 'steel framework', 'modern materials',
      'traditional construction', 'eco-friendly materials', 'premium finishes',
    ],
  },
  
  scene: {
    type: 'scene',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('城市') || subject.includes('city')) {
        descs.push('bustling cityscape', 'urban panorama', 'metropolitan view', 'city skyline')
      } else if (subject.includes('海') || subject.includes('beach')) {
        descs.push('tropical beach', 'sandy coastline', 'coastal paradise', 'seaside vista')
      } else if (subject.includes('森林') || subject.includes('forest')) {
        descs.push('lush forest', 'ancient woods', 'verdant woodland', 'magical forest')
      } else if (subject.includes('山') || subject.includes('mountain')) {
        descs.push('majestic mountain', 'alpine peak', 'towering summit', 'dramatic peaks')
      } else if (subject.includes('夜景') || subject.includes('night')) {
        descs.push('city at night', 'nighttime view', 'illuminated skyline', 'starry night scene')
      } else {
        descs.push('beautiful landscape', 'scenic view', 'stunning vista', 'picturesque setting')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with golden sunlight', 'bathed in soft light', 'under dramatic clouds',
      'with misty atmosphere', 'in magical lighting', 'with vibrant colors',
      'with peaceful ambiance', 'in ethereal glow', 'with natural beauty',
    ],
    actionModifiers: [],
    materialModifiers: [],
  },
  
  vehicle: {
    type: 'vehicle',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('汽车') || subject.includes('car')) {
        descs.push('sports car', 'luxury sedan', 'classic automobile', 'modern vehicle')
      } else if (subject.includes('摩托') || subject.includes('motorcycle')) {
        descs.push('powerful motorcycle', 'sleek bike', 'racing motorcycle', 'cruiser bike')
      } else if (subject.includes('飞机') || subject.includes('plane')) {
        descs.push('commercial airplane', 'private jet', 'vintage aircraft', 'modern aircraft')
      } else if (subject.includes('火车') || subject.includes('train')) {
        descs.push('bullet train', 'steam locomotive', 'modern railway', 'vintage train')
      } else {
        descs.push('vehicle', 'transport', 'machine', 'transportation')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'with aerodynamic design', 'in vibrant color', 'with chrome details',
      'featuring LED lighting', 'in pristine condition', 'with sporty accents',
      'with luxury interior', 'with powerful stance', 'with sleek lines',
    ],
    actionModifiers: [
      'speeding on highway', 'parked elegantly', 'racing through city',
      'cruising along coast', 'showcasing at event', 'driving through landscape',
    ],
    materialModifiers: [
      'carbon fiber body', 'aluminum alloy', 'chrome finish',
      'matte paint', 'glossy coat', 'premium leather interior',
    ],
  },
  
  food: {
    type: 'food',
    baseDescription: (subject: string, details?: string) => {
      const descs: string[] = []
      if (subject.includes('蛋糕') || subject.includes('cake')) {
        descs.push('layered cake', 'artisan cake', 'gourmet dessert', 'beautiful pastry')
      } else if (subject.includes('咖啡') || subject.includes('coffee')) {
        descs.push('artisan coffee', 'latte art', 'espresso', 'specialty brew')
      } else if (subject.includes('甜点') || subject.includes('dessert')) {
        descs.push('gourmet dessert', 'elegant sweets', 'fine pastry', 'delicate treats')
      } else if (subject.includes('料理') || subject.includes('dish')) {
        descs.push('gourmet dish', 'culinary creation', 'plated meal', 'chef specialty')
      } else {
        descs.push('delicious food', 'gourmet cuisine', 'culinary delight', 'appetizing dish')
      }
      if (details) descs.push(details)
      return descs
    },
    appearanceModifiers: [
      'beautifully plated', 'with artistic presentation', 'garnished with care',
      'in soft lighting', 'with steam rising', 'with vibrant colors',
      'on elegant tableware', 'with natural styling', 'in appetizing arrangement',
    ],
    actionModifiers: [],
    materialModifiers: [
      'fresh ingredients', 'premium quality', 'organic produce',
      'artisan ingredients', 'locally sourced', 'hand-crafted',
    ],
  },
}

// ---------- 主体内容生成器 ----------
export function generateSubjectContent(
  subjectType: SubjectType,
  subject: string,
  details?: string,
  count: number = 3
): string[] {
  const template = subjectTemplates[subjectType]
  if (!template) return [subject]
  
  const contents: string[] = []
  
  // 添加基础描述
  const baseDescs = template.baseDescription(subject, details)
  contents.push(...baseDescs)
  
  // 添加外观修饰
  const appearanceCount = Math.min(Math.floor(count / 2), template.appearanceModifiers.length)
  if (appearanceCount > 0) {
    const shuffledAppearance = shuffleArray(template.appearanceModifiers).slice(0, appearanceCount)
    contents.push(...shuffledAppearance)
  }
  
  // 添加动作修饰
  const actionCount = Math.min(Math.floor(count / 3), template.actionModifiers.length)
  if (actionCount > 0) {
    const shuffledAction = shuffleArray(template.actionModifiers).slice(0, actionCount)
    contents.push(...shuffledAction)
  }
  
  // 添加材质修饰
  const materialCount = Math.min(Math.floor(count / 3), template.materialModifiers.length)
  if (materialCount > 0) {
    const shuffledMaterial = shuffleArray(template.materialModifiers).slice(0, materialCount)
    contents.push(...shuffledMaterial)
  }
  
  return contents
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
  'stone': ['marble veining', 'granite speckle', 'sandstone texture', 'weathered rock', 'jade translucency', 'obsidian glass', 'crystal clear'],
  'glass': ['crystal glass reflection', 'frosted glass', 'stained glass', 'glass refraction', 'transparent glass', 'broken glass shards'],
  'water': ['water surface reflection', 'underwater caustics', 'rippling water', 'crystal clear water', 'ocean waves', 'water droplets'],
  'nature': ['moss texture', 'bark grain', 'petal softness', 'leaf veins', 'grass blades', 'sand grains', 'snow crystalline'],
  'food': ['food texture', 'steam rising', 'sauce glaze', 'crispy texture', 'juicy interior', 'fresh ingredients'],
  'tech': ['carbon fiber weave', 'matte plastic', 'glass screen reflection', 'circuit board detail', 'LED glow', 'holographic display'],
}

// ---------- 色彩库 ----------
export const colorLibrary: Record<string, { palette: string[]; description: string }> = {
  'warm': { palette: ['warm golden tones', 'amber', 'orange', 'crimson', 'terracotta', 'peach'], description: '温暖色调' },
  'cool': { palette: ['cool blue tones', 'teal', 'cyan', 'silver', 'ice blue', 'lavender'], description: '冷色调' },
  'monochrome': { palette: ['black and white', 'grayscale', 'high contrast', 'silver tones', 'charcoal'], description: '黑白单色' },
  'vintage': { palette: ['sepia tone', 'faded colors', 'warm yellow', 'muted brown', 'vintage wash', 'film color'], description: '复古色调' },
  'cyberpunk': { palette: ['neon pink', 'cyan blue', 'purple', 'magenta', 'electric blue', 'synthetic green'], description: '赛博朋克' },
  'pastel': { palette: ['soft pink', 'baby blue', 'mint green', 'lavender', 'peach', 'cream'], description: '柔和粉彩' },
  'earthy': { palette: ['olive green', 'terracotta', 'sand', 'clay', 'forest green', 'umber'], description: '大地色系' },
  'jewel': { palette: ['emerald green', 'sapphire blue', 'ruby red', 'amethyst purple', 'topaz yellow'], description: '宝石色调' },
  'noir': { palette: ['deep blacks', 'dark grays', 'silver highlights', 'moody blues', 'shadow tones'], description: '暗黑色调' },
  'ethereal': { palette: ['pearlescent white', 'iridescent', 'holographic', 'opal', 'soft glow', 'angelic light'], description: '空灵梦幻' },
}

// ---------- 场景库 ----------
export const sceneLibrary: Record<string, string[]> = {
  'indoor': ['cozy interior', 'warm ambient lighting', 'homey atmosphere', 'furniture details', 'indoor plants', 'window light'],
  'outdoor': ['natural landscape', 'open sky', 'environmental context', 'natural elements', 'weather effects', 'seasonal setting'],
  'urban': ['city street', 'modern architecture', 'urban landscape', 'street photography', 'city lights', 'metropolitan vibe'],
  'nature': ['lush forest', 'mountain range', 'flowing river', 'wildflower meadow', 'ancient trees', 'natural wonder'],
  'studio': ['professional photo studio', 'clean backdrop', 'controlled lighting', 'minimal setup', 'product photography setup'],
  'fantasy': ['enchanted forest', 'floating islands', 'magical realm', 'crystal cave', 'ancient ruins', 'mystical portal'],
  'cyberpunk': ['neon-lit alley', 'futuristic cityscape', 'hologaphic billboards', 'rain-slicked streets', 'cyberpunk megacity', 'dystopian future'],
  'historical': ['ancient Chinese palace', 'traditional courtyard', 'historical architecture', 'period-accurate details', 'cultural heritage'],
  'beach': ['sandy beach', 'ocean waves', 'tropical paradise', 'palm trees', 'sunset beach', 'crystal clear water'],
  'winter': ['snow-covered landscape', 'frost atmosphere', 'winter wonderland', 'ice crystals', 'northern lights', 'cozy winter cabin'],
}

// ---------- 辅助函数 ----------

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pickFromLibrary(lib: string[], count: number): string[] {
  if (lib.length <= count) return [...lib]
  return shuffleArray(lib).slice(0, count)
}

// ---------- 兼容旧API ----------
export function matchPerson(subject: string): string[] {
  return generateSubjectContent('person', subject)
}

export function matchPhotography(camera: string): string[] {
  return photographyLibrary[camera] || photographyLibrary['portrait']
}

export function matchLighting(lighting: string): string[] {
  return lightingLibrary[lighting] || lightingLibrary['cinematic']
}

export function matchQuality(quality: string): string[] {
  return qualityLibrary[quality] || qualityLibrary['high']
}

export function matchColor(mood?: string): string[] {
  const moodToColor: Record<string, string> = {
    'dreamy': 'ethereal', 'mysterious': 'noir', 'oppressive': 'noir',
    'warm': 'warm', 'lonely': 'cool', 'epic': 'jewel',
  }
  const colorKey = mood ? (moodToColor[mood] || 'warm') : 'warm'
  return colorLibrary[colorKey]?.palette || colorLibrary['warm'].palette
}
