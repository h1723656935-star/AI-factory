// @ts-nocheck
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Sparkles, Copy, Check, RefreshCw, Wand2, X, Download, ImageIcon,
  Upload, Camera, Sun, Smile, Zap, Palette, TrendingUp, ChevronDown,
  ChevronUp, ChevronRight, Star, Target, Eye, Lightbulb, FileText, Tag, BarChart3,
  ThumbsUp, AlertCircle, Plus, Trash2, Layers, Search, Bookmark,
  ArrowUpCircle, Rocket, Crown,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api-client'
import type { Prompt, PromptQualityScore, ImageAnalysis } from '@/types'

// ==================== 常量 ====================

const platforms = [
  { value: 'midjourney', label: 'Midjourney', icon: '🎨' },
  { value: 'stable-diffusion', label: 'Stable Diffusion', icon: '🖼️' },
  { value: 'dalle', label: 'DALL·E', icon: '🤖' },
  { value: 'flux', label: 'Flux', icon: '⚡' },
  { value: 'leonardo', label: 'Leonardo', icon: '🦁' },
  { value: 'jimeng', label: '即梦', icon: '✨' },
  { value: 'keling', label: '可灵', icon: '🎬' },
  { value: 'comfyui', label: 'ComfyUI', icon: '🔧' },
  { value: 'fooocus', label: 'Fooocus', icon: '🎯' },
]

const styles = [
  { value: 'cinematic', label: '电影感' },
  { value: 'anime', label: '动漫风' },
  { value: 'realistic', label: '写实' },
  { value: 'minimal', label: '极简' },
  { value: 'cyberpunk', label: '赛博朋克' },
  { value: 'vintage', label: '复古' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'noir', label: '暗黑' },
  { value: 'watercolor', label: '水彩' },
  { value: 'oil-painting', label: '油画' },
  { value: '3d-render', label: '3D渲染' },
  { value: 'pixel-art', label: '像素风' },
  { value: 'comic', label: '漫画' },
  { value: 'sketch', label: '素描' },
  { value: 'surreal', label: '超现实' },
  { value: 'gothic', label: '哥特' },
]

const aspectRatios = [
  { value: '1:1', label: '1:1 正方形' },
  { value: '3:2', label: '3:2' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9 宽屏' },
  { value: '2:3', label: '2:3' },
  { value: '3:4', label: '3:4' },
  { value: '9:16', label: '9:16 竖屏' },
]

const cameraOptions = [
  { value: '', label: '默认' },
  { value: 'close-up', label: '特写 Close Up' },
  { value: 'portrait', label: '半身 Portrait' },
  { value: 'full-body', label: '全身 Full Body' },
  { value: 'wide-angle', label: '广角 Wide Angle' },
  { value: 'bird-view', label: '鸟瞰 Bird View' },
  { value: 'pov', label: '第一人称 POV' },
  { value: 'aerial', label: '航拍 Aerial Shot' },
]

const lightingOptions = [
  { value: '', label: '默认' },
  { value: 'cinematic', label: '电影光 Cinematic' },
  { value: 'backlight', label: '逆光 Backlighting' },
  { value: 'soft', label: '柔光 Soft Lighting' },
  { value: 'volumetric', label: '体积光 Volumetric' },
  { value: 'neon', label: '霓虹光 Neon Lighting' },
  { value: 'moonlight', label: '月光 Moonlight' },
]

const moodOptions = [
  { value: 'dreamy', label: '梦幻' },
  { value: 'mysterious', label: '神秘' },
  { value: 'oppressive', label: '压抑' },
  { value: 'warm', label: '温馨' },
  { value: 'lonely', label: '孤独' },
  { value: 'epic', label: '史诗感' },
]

const qualityLevels = [
  { value: 'standard', label: '普通', icon: '📷' },
  { value: 'high', label: '高级', icon: '🌟' },
  { value: 'master', label: '大师级', icon: '👑' },
]

const modelOptions = [
  { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）' },
  { value: 'glm-4-air', label: 'GLM-4-Air' },
  { value: 'glm-4', label: 'GLM-4' },
]

const enhanceLevels = [
  { value: 'basic', label: '基础版', icon: '📝', desc: '~50词', minWords: 30 },
  { value: 'pro', label: '专业版', icon: '🚀', desc: '~100词', minWords: 80, recommended: true },
  { value: 'master', label: '大师版', icon: '👑', desc: '~200词', minWords: 150 },
]

// ==================== 风格模板库 ====================

const styleTemplates = [
  {
    category: '国风', items: [
      { label: '宋代美学', style: 'cinematic', subject: '宋式庭院，青瓦白墙，竹影斑驳，素雅配色', details: '瘦金体书法，水墨渲染，极简构图，留白艺术', mood: 'warm', lighting: 'soft' },
      { label: '唐风', style: 'fantasy', subject: '大唐盛世宫廷，金碧辉煌，牡丹盛开，霓裳羽衣', details: '华丽装饰，金色调，大气磅礴，对称构图', mood: 'epic', lighting: 'cinematic' },
      { label: '敦煌风', style: 'fantasy', subject: '敦煌飞天壁画，彩带飘舞，佛光普照，西域风情', details: '矿物质颜料质感，斑驳壁画，飞天姿态，暖金调', mood: 'dreamy', lighting: 'volumetric' },
      { label: '水墨风', style: 'watercolor', subject: '水墨山水，云雾缭绕，孤舟独钓，留白意境', details: '宣纸纹理，墨色浓淡，飞白笔触，印章落款', mood: 'lonely', lighting: 'soft' },
    ],
  },
  {
    category: '动漫', items: [
      { label: '漫剧风', style: 'comic', subject: '热血漫剧角色，动态pose，速度线，爆炸特效', details: '日式漫画风格，粗线条，网点纸，跨页构图', mood: 'epic', lighting: 'cinematic' },
      { label: '吉卜力', style: 'anime', subject: '吉卜力风格场景，蓝天白云，绿草如茵，温暖治愈', details: '手绘水彩背景，柔和光线，细腻表情，自然风光', mood: 'warm', lighting: 'soft' },
      { label: '新海诚', style: 'anime', subject: '新海诚风格，城市天际线，绚烂晚霞，细腻光影', details: '照片级背景，镜头光晕，色彩饱和度，青春感', mood: 'dreamy', lighting: 'volumetric' },
      { label: '赛璐璐', style: 'anime', subject: '90年代赛璐璐动画风格，高饱和色彩，清晰轮廓', details: '纯色填充，无渐变，硬阴影，经典电视动画质感', mood: 'warm', lighting: 'soft' },
    ],
  },
  {
    category: '写实', items: [
      { label: '电影摄影', style: 'cinematic', subject: '电影级摄影，专业布光，胶片质感，故事感', details: 'anamorphic lens, 35mm, Kodak Portra, dramatic shadows', mood: 'mysterious', lighting: 'cinematic' },
      { label: '商业广告', style: 'realistic', subject: '商业产品摄影，极简背景，完美布光，高端质感', details: 'studio lighting, product photography, clean background', mood: 'warm', lighting: 'soft' },
      { label: '时尚大片', style: 'realistic', subject: '时尚杂志封面，模特肖像，高级时装，艺术妆面', details: 'fashion editorial, Vogue style, dramatic pose, luxury', mood: 'epic', lighting: 'cinematic' },
      { label: '超写实', style: 'realistic', subject: '超写实渲染，毛孔级细节，真实材质，光学级画质', details: 'hyperrealistic, 8K, subsurface scattering, ray tracing', mood: 'warm', lighting: 'volumetric' },
    ],
  },
  {
    category: '游戏', items: [
      { label: '原神', style: 'anime', subject: '原神风格角色，开放世界场景，元素特效，璃月建筑', details: 'cel-shaded anime, vibrant colors, fantasy landscape, elemental effects', mood: 'dreamy', lighting: 'volumetric' },
      { label: '黑神话', style: 'cinematic', subject: '黑神话悟空风格，暗黑神话，中式妖怪，电影级画面', details: 'dark fantasy, Chinese mythology, photorealistic, epic boss fight', mood: 'oppressive', lighting: 'cinematic' },
      { label: '明日方舟', style: 'anime', subject: '明日方舟风格，赛博都市，战术装备，机能风设计', details: 'cyberpunk anime, tactical gear, urban dystopia, cool tones', mood: 'mysterious', lighting: 'neon' },
      { label: '永劫无间', style: 'cinematic', subject: '永劫无间风格，武侠动作，冷兵器，东方奇幻', details: 'martial arts, wuxia, dynamic combat pose, ancient China', mood: 'epic', lighting: 'cinematic' },
    ],
  },
]

// ==================== 爆款模板 ====================

const viralTemplates = [
  {
    category: '小红书爆款', icon: '📕', items: [
      { label: '氛围感美女', platform: 'midjourney', subject: '亚洲女性，氛围感肖像，自然光，温柔眼神', style: 'cinematic', camera: 'portrait', lighting: 'soft', mood: 'warm', quality: 'master', aspectRatio: '3:4' },
      { label: '极简穿搭', platform: 'midjourney', subject: '时尚博主，极简穿搭，高级感，街拍风格', style: 'minimal', camera: 'full-body', lighting: 'soft', mood: 'warm', quality: 'high', aspectRatio: '2:3' },
      { label: '治愈系插画', platform: 'midjourney', subject: '可爱猫咪，温暖咖啡店，治愈插画风格', style: 'watercolor', camera: 'wide-angle', lighting: 'soft', mood: 'warm', quality: 'high', aspectRatio: '1:1' },
    ],
  },
  {
    category: '抖音爆款', icon: '🎵', items: [
      { label: '赛博朋克转场', platform: 'midjourney', subject: '赛博朋克都市夜景，霓虹灯，未来科技感', style: 'cyberpunk', camera: 'wide-angle', lighting: 'neon', mood: 'mysterious', quality: 'master', aspectRatio: '9:16' },
      { label: '卡点变装', platform: 'midjourney', subject: '时尚变装前后对比，华丽服装，戏剧性灯光', style: 'cinematic', camera: 'full-body', lighting: 'cinematic', mood: 'epic', quality: 'high', aspectRatio: '9:16' },
      { label: '美食探店', platform: 'midjourney', subject: '精致美食特写，诱人质感，暖色调，餐厅氛围', style: 'realistic', camera: 'close-up', lighting: 'soft', mood: 'warm', quality: 'high', aspectRatio: '9:16' },
    ],
  },
  {
    category: '国风美女', icon: '🏮', items: [
      { label: '敦煌飞天', platform: 'midjourney', subject: '敦煌飞天仙女，飘带飞舞，佛光，石窟壁画风格', style: 'fantasy', camera: 'full-body', lighting: 'volumetric', mood: 'dreamy', quality: 'master', aspectRatio: '2:3' },
      { label: '汉服仕女', platform: 'midjourney', subject: '汉服仕女，古风庭院，桃花盛开，古典美人', style: 'cinematic', camera: 'portrait', lighting: 'soft', mood: 'warm', quality: 'master', aspectRatio: '3:4' },
    ],
  },
  {
    category: '玄幻漫剧', icon: '🐉', items: [
      { label: '修仙渡劫', platform: 'midjourney', subject: '修仙者渡劫，天雷滚滚，灵气环绕，史诗场景', style: 'fantasy', camera: 'wide-angle', lighting: 'volumetric', mood: 'epic', quality: 'master', aspectRatio: '9:16' },
      { label: '御剑飞行', platform: 'midjourney', subject: '仙侠御剑飞行，云海翻腾，仙山琼阁，飘逸感', style: 'fantasy', camera: 'aerial', lighting: 'volumetric', mood: 'dreamy', quality: 'master', aspectRatio: '16:9' },
    ],
  },
  {
    category: 'AI写真', icon: '📸', items: [
      { label: '证件照', platform: 'midjourney', subject: '专业证件照，白底，正面，自然表情，商务着装', style: 'realistic', camera: 'portrait', lighting: 'soft', mood: 'warm', quality: 'high', aspectRatio: '3:4' },
      { label: '韩式写真', platform: 'midjourney', subject: '韩式写真风格，清新妆容，温柔光线，简约背景', style: 'cinematic', camera: 'portrait', lighting: 'soft', mood: 'warm', quality: 'master', aspectRatio: '2:3' },
    ],
  },
  {
    category: '电商产品图', icon: '🛍️', items: [
      { label: '白底产品', platform: 'midjourney', subject: '产品摄影，纯白背景，商业布光，高质感', style: 'minimal', camera: 'close-up', lighting: 'soft', quality: 'high', aspectRatio: '1:1' },
      { label: '场景展示', platform: 'midjourney', subject: '产品场景展示，生活化布置，自然光，高级感', style: 'realistic', camera: 'wide-angle', lighting: 'soft', mood: 'warm', quality: 'high', aspectRatio: '4:3' },
    ],
  },
]

// ==================== 组件：标签可视编辑器 ====================

function TagEditor({ tags: initialTags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [newTag, setNewTag] = useState('')
  const [localTags, setLocalTags] = useState<string[]>(initialTags)

  const addTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !localTags.includes(trimmed)) {
      const updated = [...localTags, trimmed]
      setLocalTags(updated)
      onChange(updated)
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    const updated = localTags.filter((t) => t !== tag)
    setLocalTags(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {localTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium group hover:bg-gold-500/20 transition-all cursor-default"
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-0.5 p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="添加自定义标签..."
          className="flex-1 bg-gray-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:border-gold-500/30 transition-all"
        />
        <button
          onClick={addTag}
          className="p-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ==================== 组件：质量评分 ====================

function QualityScoreCard({ score }: { score: PromptQualityScore }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-green-400'
    if (v >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBg = (v: number) => {
    if (v >= 80) return 'bg-green-500/10 border-green-500/20'
    if (v >= 60) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  const getLabel = (v: number) => {
    if (v >= 90) return 'S级 · 大师级'
    if (v >= 80) return 'A级 · 优秀'
    if (v >= 60) return 'B级 · 良好'
    return 'C级 · 待优化'
  }

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between p-3 rounded-xl border ${getBg(score.total)}`}>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm font-medium">Prompt 质量评分</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getColor(score.total)}`}>{score.total}分</span>
          <span className={`text-xs px-2 py-0.5 rounded ${getBg(score.total)} ${getColor(score.total)}`}>
            {getLabel(score.total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '细节丰富度', value: score.detail },
          { label: '构图完整度', value: score.composition },
          { label: '风格准确度', value: score.style },
          { label: '平台适配度', value: score.platform },
        ].map((dim) => (
          <div key={dim.label} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
            <div className={`text-lg font-bold ${getColor(dim.value)}`}>{dim.value}</div>
            <div className="text-xs text-gray-400">{dim.label}</div>
          </div>
        ))}
      </div>

      {score.suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> 优化建议
          </p>
          {score.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gold-500/5 border border-gold-500/10">
              <Star className="w-3 h-3 text-gold-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-300">{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== 主页面 ====================

export default function PromptGeneratorPage() {
  const { user } = useAuth()

  // 表单状态
  const [platform, setPlatform] = useState('midjourney')
  const [subject, setSubject] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [details, setDetails] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [model, setModel] = useState('glm-4-flash')
  const [language, setLanguage] = useState<'cn' | 'en'>('cn')
  const [camera, setCamera] = useState('')
  const [lighting, setLighting] = useState('')
  const [mood, setMood] = useState('')
  const [quality, setQuality] = useState('')
  const [enhanceLevel, setEnhanceLevel] = useState('pro')
  const [optimizing, setOptimizing] = useState(false)

  // UI 状态
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'viral' | 'image'>('generate')
  const [editedTags, setEditedTags] = useState<string[]>([])

  // 图片反推状态
  const [imageUploading, setImageUploading] = useState(false)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 生成提示词
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return

    setLoading(true)
    setError('')
    setPrompt(null)

    try {
      const data = await apiFetch<Prompt>('/api/prompt/generate', {
        method: 'POST',
        body: JSON.stringify({
          platform, subject, style, details: details || undefined,
          negativePrompt: negativePrompt || undefined, aspectRatio, model, language,
          camera: camera || undefined, lighting: lighting || undefined,
          mood: mood || undefined, quality: quality || undefined,
          enhanceLevel,
        }),
      })
      setPrompt(data)
      setEditedTags(data.tags || [])
      setActiveTab('generate')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提示词生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 一键优化
  const handleOptimize = async () => {
    if (!prompt?.generated_prompt) return

    setOptimizing(true)
    setError('')

    try {
      const data = await apiFetch<{
        original_prompt: string
        optimized_prompt: string
        quality_score: PromptQualityScore
        improvement: { originalScore: number; optimizedScore: number; improvement: number }
      }>('/api/prompt/generate?optimize=true', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.generated_prompt,
          platform,
          style,
          model,
          language,
        }),
      })
      // 更新结果
      setPrompt({
        ...prompt,
        generated_prompt: data.optimized_prompt,
        quality_score: data.quality_score,
        tags: [...(prompt.tags || []), '已优化'],
      })
      setEditedTags((prev) => [...prev, '已优化', `+${data.improvement.improvement}分`])
    } catch (err) {
      setError(err instanceof Error ? err.message : '一键优化失败，请稍后重试')
    } finally {
      setOptimizing(false)
    }
  }

  // 复制
  const handleCopy = async () => {
    if (!prompt?.generated_prompt) return
    await navigator.clipboard.writeText(prompt.generated_prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 下载 TXT
  const handleDownload = () => {
    if (!prompt?.generated_prompt) return
    let content = prompt.generated_prompt
    if (prompt.negative_prompt_full) {
      content += '\n\n' + prompt.negative_prompt_full
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 应用风格模板
  const applyStyleTemplate = (tpl: { subject: string; style: string; details?: string; mood?: string; lighting?: string; camera?: string }) => {
    setSubject(tpl.subject)
    setStyle(tpl.style)
    if (tpl.details) setDetails(tpl.details)
    if (tpl.mood) setMood(tpl.mood)
    if (tpl.lighting) setLighting(tpl.lighting)
    if (tpl.camera) setCamera(tpl.camera || '')
    setShowAdvanced(true)
    setActiveTab('generate')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 应用爆款模板
  const applyViralTemplate = (tpl: { platform: string; subject: string; style: string; camera?: string; lighting?: string; mood?: string; quality?: string; aspectRatio?: string }) => {
    setPlatform(tpl.platform)
    setSubject(tpl.subject)
    setStyle(tpl.style)
    if (tpl.camera) setCamera(tpl.camera)
    if (tpl.lighting) setLighting(tpl.lighting)
    if (tpl.mood) setMood(tpl.mood || '')
    if (tpl.quality) setQuality(tpl.quality)
    if (tpl.aspectRatio) setAspectRatio(tpl.aspectRatio)
    setShowAdvanced(true)
    setActiveTab('generate')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 图片反推
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB')
      return
    }

    setImageUploading(true)
    setError('')
    setImageAnalysis(null)

    // 预览
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => {
          const result = r.result as string
          resolve(result.split(',')[1])
        }
        r.onerror = reject
        r.readAsDataURL(file)
      })

      const data = await apiFetch<ImageAnalysis>('/api/prompt/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: base64, model, language }),
      })
      setImageAnalysis(data)

      // 自动填充表单
      if (data.subject) setSubject(data.subject)
      if (data.style) {
        const matched = styles.find((s) => data.style.toLowerCase().includes(s.label.toLowerCase()) || data.style.toLowerCase().includes(s.value))
        if (matched) setStyle(matched.value)
      }
      if (data.camera) {
        const matched = cameraOptions.find((c) => data.camera.toLowerCase().includes(c.value.replace('-', ' ')) || data.camera.toLowerCase().includes(c.label.toLowerCase()))
        if (matched && matched.value) setCamera(matched.value)
      }
      if (data.lighting) {
        const matched = lightingOptions.find((l) => data.lighting.toLowerCase().includes(l.value) || data.lighting.toLowerCase().includes(l.label.toLowerCase()))
        if (matched && matched.value) setLighting(matched.value)
      }
      setShowAdvanced(true)
    } catch (err) {
      setError('图片分析失败，请确保使用的模型支持视觉功能（如 GLM-4V、GPT-4o 等），或直接手动填写参数')
    } finally {
      setImageUploading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <Layout title="AI 绘图提示词工厂 Pro" description="无需懂 Prompt，也能快速生成专业级 AI 绘图提示词">
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue text-sm font-medium mb-4">
              <Wand2 className="w-4 h-4" />
              AI 绘图提示词工厂 Pro
            </div>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              让 AI 帮你写<span className="bg-gradient-to-r from-gold-500 to-purple-400 bg-clip-text text-transparent">专业级</span>绘图提示词
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              无需懂 Prompt 工程，只需描述你的想法，AI 自动生成适配各平台的顶级绘图提示词。
            </p>
          </div>

          {/* 标签导航 */}
          <div className="flex flex-wrap items-center gap-2 mb-8 justify-center">
            {[
              { key: 'generate', label: '提示词生成', icon: <Wand2 className="w-4 h-4" /> },
              { key: 'templates', label: '风格模板', icon: <Palette className="w-4 h-4" /> },
              { key: 'viral', label: '爆款模板', icon: <TrendingUp className="w-4 h-4" /> },
              { key: 'image', label: '图片反推', icon: <Upload className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========== 生成面板 ========== */}
          {activeTab === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：表单 */}
              <div className="glass-card-dark p-6 border border-gold-500/20">
                <form onSubmit={handleGenerate} className="space-y-5">
                  {/* 平台选择 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">AI 平台</label>
                    <div className="grid grid-cols-3 gap-2">
                      {platforms.slice(0, 9).map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPlatform(p.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            platform === p.value
                              ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 主体描述 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">主体描述</label>
                    <textarea
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="例如：一只戴着墨镜的柴犬在夏威夷海滩冲浪，浪花飞溅，阳光灿烂..."
                      rows={3}
                      className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none"
                      required
                    />
                  </div>

                  {/* 风格 & 比例 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">画面风格</label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                      >
                        {styles.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">画面比例</label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                      >
                        {aspectRatios.map((a) => (
                          <option key={a.value} value={a.value}>{a.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 高级参数面板 */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-gold-500 transition-all"
                    >
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      高级参数 {showAdvanced ? '收起' : '展开'}
                      {(camera || lighting || mood || quality) && (
                        <span className="px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 text-xs">
                          {[camera, lighting, mood, quality].filter(Boolean).length} 项已选
                        </span>
                      )}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5 animate-in">
                      {/* 镜头语言 */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-gold-500" /> 镜头语言
                        </label>
                        <select
                          value={camera}
                          onChange={(e) => setCamera(e.target.value)}
                          className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-gold-500/30 transition-all"
                        >
                          {cameraOptions.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* 光影系统 */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-gold-500" /> 光影系统
                        </label>
                        <select
                          value={lighting}
                          onChange={(e) => setLighting(e.target.value)}
                          className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-gold-500/30 transition-all"
                        >
                          {lightingOptions.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* 情绪氛围 */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Smile className="w-3.5 h-3.5 text-gold-500" /> 情绪氛围
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setMood('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              !mood ? 'bg-gold-500 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            不限
                          </button>
                          {moodOptions.map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              onClick={() => setMood(m.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                mood === m.value
                                  ? 'bg-gold-500 text-black'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 画质等级 */}
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-gold-500" /> 画质等级
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {qualityLevels.map((q) => (
                            <button
                              key={q.value}
                              type="button"
                              onClick={() => setQuality(q.value)}
                              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                                quality === q.value
                                  ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                              }`}
                            >
                              <span className="block text-base mb-0.5">{q.icon}</span>
                              {q.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 补充细节 & 负面提示词 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">补充细节（可选）</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="光照、构图、材质等..."
                        rows={2}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">负面提示词（可选）</label>
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="不希望出现的元素..."
                        rows={2}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500/50 transition-all resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 模型 & 语言 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">AI 模型</label>
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all"
                      >
                        {modelOptions.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">输出语言</label>
                      <div className="flex rounded-xl overflow-hidden border border-gold-500/20">
                        <button
                          type="button"
                          onClick={() => setLanguage('cn')}
                          className={`flex-1 py-3 text-sm font-medium transition-all ${
                            language === 'cn' ? 'bg-gold-500 text-black' : 'bg-gray-900/50 text-gray-400 hover:text-white'
                          }`}
                        >
                          中文
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('en')}
                          className={`flex-1 py-3 text-sm font-medium transition-all ${
                            language === 'en' ? 'bg-gold-500 text-black' : 'bg-gray-900/50 text-gray-400 hover:text-white'
                          }`}
                        >
                          English
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 增强等级 */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-gold-500" /> Prompt 增强等级
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {enhanceLevels.map((lvl) => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setEnhanceLevel(lvl.value)}
                          className={`p-3 rounded-xl text-center transition-all border ${
                            enhanceLevel === lvl.value
                              ? 'bg-gold-500/20 border-gold-500/50 shadow-lg shadow-gold-500/10'
                              : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                          }`}
                        >
                          <span className="block text-xl mb-1">{lvl.icon}</span>
                          <span className={`block text-sm font-bold ${enhanceLevel === lvl.value ? 'text-gold-500' : 'text-gray-300'}`}>
                            {lvl.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{lvl.desc}</span>
                          {lvl.recommended && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 text-xs">
                              推荐
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 生成按钮 */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-black font-bold hover:from-gold-400 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {loading ? 'AI 正在生成...' : '生成提示词'}
                  </button>
                </form>
              </div>

              {/* 右侧：结果 */}
              <div className="glass-card-dark p-6 border border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-orbitron text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold-500" />
                    生成结果
                  </h2>
                  {prompt && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                        title="复制"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all"
                        title="下载 TXT"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-gray-900/50 rounded-xl p-4 overflow-auto min-h-[400px] space-y-4">
                  {prompt ? (
                    <>
                      {/* 标签区 */}
                      {editedTags.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Tag className="w-3 h-3" /> 标签
                          </p>
                          <TagEditor tags={editedTags} onChange={setEditedTags} />
                        </div>
                      )}

                      {/* 提示词文本 */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">提示词</p>
                        <div className="p-3 rounded-lg bg-black/30 border border-gold-500/10 font-mono text-sm text-gray-200 whitespace-pre-wrap leading-relaxed relative group">
                          {prompt.generated_prompt}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={handleCopy}
                              className="p-1.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SDXL Negative Prompt */}
                      {prompt.negative_prompt_full && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Negative Prompt</p>
                          <div className="p-3 rounded-lg bg-black/30 border border-red-500/10 font-mono text-sm text-red-300/80 whitespace-pre-wrap leading-relaxed">
                            {prompt.negative_prompt_full}
                          </div>
                        </div>
                      )}

                      {/* 平台专属参数 */}
                      {prompt.platform_params && (prompt.platform_params.midjourney || prompt.platform_params.sdxl) && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">平台参数</p>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            {prompt.platform_params.midjourney && (
                              <div className="space-y-1 text-xs font-mono text-gray-300">
                                <p>--ar {prompt.platform_params.midjourney.ar}</p>
                                <p>--stylize {prompt.platform_params.midjourney.stylize}</p>
                                <p>--v {prompt.platform_params.midjourney.version}</p>
                              </div>
                            )}
                            {prompt.platform_params.sdxl && (
                              <div className="space-y-1 text-xs font-mono text-gray-300">
                                <p>CFG Scale: {prompt.platform_params.sdxl.cfg}</p>
                                <p>Steps: {prompt.platform_params.sdxl.steps}</p>
                                <p>Sampler: {prompt.platform_params.sdxl.sampler}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 质量评分 */}
                      {prompt.quality_score && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">质量评分</p>
                          <QualityScoreCard score={prompt.quality_score} />
                        </div>
                      )}

                      {/* 一键优化按钮 */}
                      {prompt.quality_score && prompt.quality_score.total < 85 && (
                        <button
                          onClick={handleOptimize}
                          disabled={optimizing}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyber-blue/20 border border-purple-500/30 text-purple-400 hover:border-purple-500/50 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {optimizing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4" />
                          )}
                          {optimizing ? '正在优化...' : '一键优化 — 自动补充镜头、光影、材质、构图'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[400px]">
                      <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">在左侧填写信息</p>
                      <p className="text-sm mt-1">AI 将为你生成专业的绘图提示词</p>
                      <p className="text-xs mt-4 text-gray-600">支持 Midjourney / SDXL / Flux / 即梦 / 可灵 等平台</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== 风格模板库 ========== */}
          {activeTab === 'templates' && (
            <div className="space-y-8">
              {styleTemplates.map((group) => (
                <div key={group.category}>
                  <h3 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-gold-500" />
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {group.items.map((tpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyStyleTemplate(tpl)}
                        className="glass-card-dark p-4 border border-white/10 rounded-xl text-left hover:border-gold-500/30 transition-all group hover:shadow-lg hover:shadow-gold-500/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gold-500 text-sm font-bold group-hover:text-gold-400">{tpl.label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gold-500 transition-all group-hover:translate-x-0.5" />
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-2 mb-2">{tpl.subject}</p>
                        <div className="flex flex-wrap gap-1">
                          {tpl.mood && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs">
                              {moodOptions.find((m) => m.value === tpl.mood)?.label}
                            </span>
                          )}
                          {tpl.lighting && (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-xs">
                              {lightingOptions.find((l) => l.value === tpl.lighting)?.label}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========== 爆款模板中心 ========== */}
          {activeTab === 'viral' && (
            <div className="space-y-8">
              {viralTemplates.map((group) => (
                <div key={group.category}>
                  <h3 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">{group.icon}</span>
                    {group.category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.items.map((tpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyViralTemplate(tpl)}
                        className="glass-card-dark p-4 border border-white/10 rounded-xl text-left hover:border-gold-500/30 transition-all group hover:shadow-lg hover:shadow-gold-500/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gold-500 text-sm font-bold group-hover:text-gold-400">{tpl.label}</span>
                          <Sparkles className="w-3.5 h-3.5 text-gray-600 group-hover:text-gold-500 transition-all" />
                        </div>
                        <p className="text-gray-400 text-xs line-clamp-2 mb-2">{tpl.subject}</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-xs">
                            {platforms.find((p) => p.value === tpl.platform)?.label}
                          </span>
                          {tpl.quality === 'master' && (
                            <span className="px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 text-xs">大师级</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========== 图片反推 ========== */}
          {activeTab === 'image' && (
            <div className="max-w-3xl mx-auto">
              <div className="glass-card-dark p-8 border border-gold-500/20 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
                    <Upload className="w-8 h-8 text-gold-500" />
                  </div>
                  <h3 className="font-orbitron text-xl font-bold text-white mb-2">AI 图片反推</h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    上传一张参考图，AI 自动分析主体、构图、风格、色彩、光影，并生成完整的绘图提示词。
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        width={512}
                        height={512}
                        className="max-h-64 rounded-xl border border-white/10 object-contain"
                        unoptimized
                      />
                      <button
                        onClick={() => { setImagePreview(null); setImageAnalysis(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {imageUploading && (
                      <div className="flex items-center justify-center gap-2 text-gold-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">AI 正在分析图片...</span>
                      </div>
                    )}

                    {imageAnalysis && (
                      <div className="text-left space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">主体</span>
                            <p className="text-sm text-white">{imageAnalysis.subject}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">构图</span>
                            <p className="text-sm text-white">{imageAnalysis.composition}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">镜头</span>
                            <p className="text-sm text-white">{imageAnalysis.camera}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">风格</span>
                            <p className="text-sm text-white">{imageAnalysis.style}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">色彩</span>
                            <p className="text-sm text-white">{imageAnalysis.colors}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">光影</span>
                            <p className="text-sm text-white">{imageAnalysis.lighting}</p>
                          </div>
                        </div>
                        {imageAnalysis.tags && imageAnalysis.tags.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">标签</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {imageAnalysis.tags.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 text-xs">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => { setActiveTab('generate'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          className="w-full py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-500 hover:bg-gold-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <Wand2 className="w-4 h-4" />
                          用此分析生成提示词
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-dashed border-gold-500/30 text-gold-500 hover:border-gold-500/50 hover:bg-gold-500/5 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    上传参考图片
                  </button>
                )}

                <p className="text-xs text-gray-600 mt-4">
                  支持 JPG、PNG、WebP 格式，最大 10MB。需要配置支持视觉的模型（如 GLM-4V）。
                </p>
              </div>
            </div>
          )}

          {/* 加载动画 */}
          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="glass-card-dark p-8 rounded-2xl border border-gold-500/20 text-center">
                <RefreshCw className="w-12 h-12 text-gold-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium">AI 正在生成提示词...</p>
                <p className="text-gray-400 text-sm mt-1">正在分析需求并生成专业级提示词</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}