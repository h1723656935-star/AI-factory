// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import {
  Sparkles, Copy, Check, RefreshCw, Wand2, X, Download, ImageIcon,
  Upload, Camera, Sun, Smile, Zap, Palette, TrendingUp, ChevronDown,
  ChevronUp, ChevronRight, Star, Target, Eye, Lightbulb, FileText, Tag, BarChart3,
  ThumbsUp, AlertCircle, Plus, Trash2, Layers, Search, Bookmark,
  ArrowUpCircle, Rocket, Crown, Video, Play, Film, Heart, Clock,
  History, BookOpen, Grid3X3, Flame, Filter, Sliders, Cpu, PenTool,
  LayoutDashboard, ListChecks, Radar, Save, Edit3, MoreHorizontal,
  TrendingUp as TrendingUpIcon, ArrowRight, Home, Monitor, Tablet,
} from 'lucide-react'
import Layout from '@/components/Layout'
import { apiFetch } from '@/lib/api-client'
import type {
  Prompt, PromptQualityScore, PromptPlatformParams, ImageAnalysis,
  LabResult, LabVariant, Favorite, VideoAnalysisResult, OptimizeResult,
  TagCategory, HotPrompt, MissingItem,
} from '@/types'

// ==================== 常量 ====================

const platforms = [
  { value: 'midjourney', label: 'Midjourney', icon: '🎨' },
  { value: 'flux', label: 'Flux', icon: '🌀' },
  { value: 'stable-diffusion', label: 'SDXL', icon: '🖼️' },
  { value: 'jimeng', label: '即梦', icon: '💭' },
  { value: 'keling', label: '可灵', icon: '🎬' },
  { value: 'dalle', label: 'DALL·E', icon: '🤖' },
  { value: 'leonardo', label: 'Leonardo', icon: '🦁' },
  { value: 'comfyui', label: 'ComfyUI', icon: '🔧' },
  { value: 'fooocus', label: 'Fooocus', icon: '🎯' },
]

const styles = [
  { value: 'cinematic', label: '电影感', icon: '🎬' },
  { value: 'anime', label: '动漫', icon: '🌸' },
  { value: 'realistic', label: '写实', icon: '📸' },
  { value: 'cyberpunk', label: '赛博朋克', icon: '🌃' },
  { value: 'fantasy', label: '奇幻', icon: '🧙' },
  { value: 'watercolor', label: '水彩', icon: '🎨' },
  { value: 'oil-painting', label: '油画', icon: '🖌️' },
  { value: '3d-render', label: '3D渲染', icon: '💎' },
  { value: 'comic', label: '漫画', icon: '💥' },
  { value: 'sketch', label: '素描', icon: '✏️' },
  { value: 'surreal', label: '超现实', icon: '🌀' },
  { value: 'gothic', label: '哥特', icon: '🦇' },
  { value: 'vintage', label: '复古', icon: '📷' },
  { value: 'noir', label: '暗黑', icon: '🕶️' },
  { value: 'minimal', label: '极简', icon: '⚪' },
  { value: 'pixel-art', label: '像素', icon: '👾' },
]

const modelOptions = [
  { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）' },
  { value: 'glm-4-air', label: 'GLM-4-Air' },
  { value: 'glm-4', label: 'GLM-4' },
]

const enhanceLevels = [
  { value: 'basic', label: '基础版', icon: '📝', desc: '~50词' },
  { value: 'pro', label: '专业版', icon: '🚀', desc: '~100词', recommended: true },
  { value: 'master', label: '大师版', icon: '👑', desc: '~200词' },
]

const favoriteCategories = ['全部', '国风', '漫剧', '写真', '产品图', '海报设计', '短视频', '其他']

const industryModes = [
  { value: 'portrait', label: '人像写真', icon: '👤' },
  { value: 'ecommerce', label: '电商产品', icon: '🛍️' },
  { value: 'fashion', label: '服装模特', icon: '👗' },
  { value: 'poster', label: '海报设计', icon: '🎯' },
  { value: 'ip-character', label: 'IP角色', icon: '🧸' },
  { value: 'game-character', label: '游戏角色', icon: '🎮' },
  { value: 'architecture', label: '建筑设计', icon: '🏛️' },
  { value: 'interior', label: '室内设计', icon: '🛋️' },
  { value: 'short-video', label: '短视频分镜', icon: '📱' },
  { value: 'ai-film', label: 'AI电影', icon: '🎥' },
]

const labStyles = [
  { value: 'realistic', label: '写实版', icon: '📸' },
  { value: 'cinematic', label: '电影版', icon: '🎬' },
  { value: 'anime', label: '漫剧版', icon: '🌸' },
  { value: 'cyberpunk', label: '赛博朋克', icon: '🌃' },
  { value: 'fantasy', label: '奇幻版', icon: '🧙' },
  { value: 'watercolor', label: '水彩版', icon: '🎨' },
  { value: '3d-render', label: '3D版', icon: '💎' },
  { value: 'sketch', label: '素描版', icon: '✏️' },
]

// ==================== 子组件 ====================

function QualityScoreCard({ score }: { score: PromptQualityScore }) {
  const getGrade = (s: number) => (s >= 90 ? 'S' : s >= 80 ? 'A' : s >= 65 ? 'B' : 'C')
  const getColor = (s: number) => (s >= 90 ? 'text-green-400' : s >= 80 ? 'text-gold-500' : s >= 65 ? 'text-yellow-400' : 'text-red-400')

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">Prompt 质量评分</span>
        <span className={`text-2xl font-orbitron font-bold ${getColor(score.total)}`}>
          {score.total}
          <span className="text-xs ml-1">{getGrade(score.total)}</span>
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: '细节丰富度', value: score.detail },
          { label: '构图完整度', value: score.composition },
          { label: '风格准确度', value: score.style },
          { label: '平台适配度', value: score.platform },
        ].map((dim) => (
          <div key={dim.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-20">{dim.label}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${getColor(dim.value)}`} style={{ width: `${dim.value}%`, background: dim.value >= 90 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : dim.value >= 80 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #f97316, #facc15)' }} />
            </div>
            <span className="text-xs text-gray-400 w-8">{dim.value}</span>
          </div>
        ))}
      </div>
      {/* 缺失项 */}
      {score.missingItems && score.missingItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">缺失项检测</p>
          <div className="flex flex-wrap gap-1.5">
            {score.missingItems.map((item, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded text-xs ${item.missing ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}
                title={item.suggestion || ''}
              >
                {item.missing ? '✗ ' : '✓ '}{item.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {score.suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">优化建议</p>
          {score.suggestions.slice(0, 3).map((s, i) => (
            <p key={i} className="text-xs text-gold-500/80 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 flex-shrink-0" /> {s}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function PromptTag({ label, onRemove, onClick }: { label: string; onRemove?: () => void; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gold-500/10 text-gold-400 border border-gold-500/20 ${onClick ? 'cursor-pointer hover:bg-gold-500/20' : ''} transition-all`}
    >
      {label}
      {onRemove && (
        <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={(e) => { e.stopPropagation(); onRemove() }} />
      )}
    </span>
  )
}

// ==================== 主页面 ====================

export default function PromptStudio() {
  // 通用状态
  const [activeTab, setActiveTab] = useState('generate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [model, setModel] = useState('glm-4-flash')
  const [language, setLanguage] = useState<'cn' | 'en'>('cn')

  // ===== 生成器状态 =====
  const [platform, setPlatform] = useState('midjourney')
  const [subject, setSubject] = useState('')
  const [style, setStyle] = useState('cinematic')
  const [details, setDetails] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [camera, setCamera] = useState('')
  const [lighting, setLighting] = useState('')
  const [mood, setMood] = useState('')
  const [quality, setQuality] = useState('')
  const [enhanceLevel, setEnhanceLevel] = useState('pro')
  const [useTemplate, setUseTemplate] = useState(true)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  // ===== 优化器状态 =====
  const [optInput, setOptInput] = useState('')
  const [optPlatform, setOptPlatform] = useState('midjourney')
  const [optLevel, setOptLevel] = useState('pro')
  const [optResult, setOptResult] = useState<OptimizeResult | null>(null)
  const [optimizing, setOptimizing] = useState(false)

  // ===== 图片反推 =====
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null)

  // ===== 视频反推 =====
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysisResult | null>(null)

  // ===== 实验室 =====
  const [labSubject, setLabSubject] = useState('')
  const [labIndustry, setLabIndustry] = useState('')
  const [labResult, setLabResult] = useState<LabResult | null>(null)

  // ===== 收藏夹 =====
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [favCategory, setFavCategory] = useState('all')
  const [favSearch, setFavSearch] = useState('')

  // ===== 历史记录 =====
  const [historyPeriod, setHistoryPeriod] = useState('all')
  const [historyItems, setHistoryItems] = useState<any[]>([])

  // ===== 标签库 =====
  const [tagLibrary, setTagLibrary] = useState<TagCategory[]>([])
  const [tagSearch, setTagSearch] = useState('')

  // ===== 爆款广场 =====
  const [hotPrompts, setHotPrompts] = useState<HotPrompt[]>([])
  const [hotCategory, setHotCategory] = useState('all')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ==================== 通用函数 ====================

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const addTag = (tag: string) => {
    if (!editedTags.includes(tag)) setEditedTags([...editedTags, tag])
  }

  const removeTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag))
  }

  // ==================== 生成器 ====================

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim()) return
    setLoading(true); setError(''); setPrompt(null)
    try {
      const data = await apiFetch<Prompt>('/api/prompt/generate', {
        method: 'POST',
        body: JSON.stringify({
          platform, subject, style, details: details || undefined,
          negativePrompt: negativePrompt || undefined, aspectRatio, model, language,
          camera: camera || undefined, lighting: lighting || undefined,
          mood: mood || undefined, quality: quality || undefined, enhanceLevel,
          useTemplate,
        }),
      })
      setPrompt(data); setEditedTags(data.tags || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally { setLoading(false) }
  }

  const handleOptimize = async () => {
    if (!prompt?.generated_prompt) return
    setOptimizing(true); setError('')
    try {
      const data = await apiFetch<OptimizeResult>('/api/prompt/optimize', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.generated_prompt, platform, level: 'pro', style, model, language,
        }),
      })
      setPrompt({ ...prompt, generated_prompt: data.optimized_prompt, quality_score: data.quality_score, tags: [...(prompt.tags || []), '已优化'] })
      setEditedTags((prev) => [...prev, '已优化', `+${data.improvement.improvement}分`])
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败')
    } finally { setOptimizing(false) }
  }

  // ==================== 图片反推 ====================

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true); setError('')
    try {
      const base64 = (await new Promise<string>((resolve) => {
        const r = new FileReader()
        r.onload = (ev) => resolve((ev.target?.result as string).split(',')[1])
        r.readAsDataURL(file)
      }))
      const data = await apiFetch<ImageAnalysis>('/api/prompt/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: base64, model, language }),
      })
      setImageAnalysis(data)
      // Auto-fill
      setSubject(data.subject)
      setStyle(data.style as any)
      setCamera(data.camera as any)
      setLighting(data.lighting as any)
      setDetails(data.colors)
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片分析失败')
    } finally { setLoading(false) }
  }

  // ==================== 视频反推 ====================

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setLoading(true); setError('')
    try {
      const data = await apiFetch<VideoAnalysisResult>('/api/prompt/analyze-video', {
        method: 'POST',
        body: JSON.stringify({ model, language }),
      })
      setVideoAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '视频分析失败')
    } finally { setLoading(false) }
  }

  // ==================== 实验室 ====================

  const handleLabGenerate = async () => {
    if (!labSubject.trim()) return
    setLoading(true); setError('')
    try {
      const data = await apiFetch<LabResult>('/api/prompt/lab', {
        method: 'POST',
        body: JSON.stringify({
          subject: labSubject, industry: labIndustry || undefined, model, language,
        }),
      })
      setLabResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '实验室生成失败')
    } finally { setLoading(false) }
  }

  // ==================== 优化器 ====================

  const handleOptimizeStandalone = async () => {
    if (!optInput.trim()) return
    setOptimizing(true); setError('')
    try {
      const data = await apiFetch<OptimizeResult>('/api/prompt/optimize', {
        method: 'POST',
        body: JSON.stringify({
          prompt: optInput, platform: optPlatform, level: optLevel, model, language,
        }),
      })
      setOptResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败')
    } finally { setOptimizing(false) }
  }

  // ==================== 收藏夹 ====================

  const loadFavorites = async () => {
    try {
      const data = await apiFetch<Favorite[]>(`/api/prompt/favorites?category=${favCategory}&search=${favSearch}`)
      setFavorites(data || [])
    } catch { setFavorites([]) }
  }

  const saveFavorite = async () => {
    if (!prompt?.generated_prompt) return
    try {
      await apiFetch('/api/prompt/favorites', {
        method: 'POST',
        body: JSON.stringify({
          prompt: prompt.generated_prompt,
          negative_prompt: prompt.negative_prompt_full || undefined,
          platform: prompt.platform,
          style: prompt.style,
          category: 'general',
          tags: prompt.tags || [],
        }),
      })
      setError('')
      alert('已收藏！')
    } catch (err) {
      setError(err instanceof Error ? err.message : '收藏失败')
    }
  }

  // ==================== 数据加载 ====================

  useEffect(() => {
    if (activeTab === 'favorites') loadFavorites()
    if (activeTab === 'history') {
      apiFetch<any[]>(`/api/prompt/history?period=${historyPeriod}`).then(setHistoryItems).catch(() => setHistoryItems([]))
    }
    if (activeTab === 'tags') {
      apiFetch<TagCategory[]>('/api/prompt/tags').then(setTagLibrary).catch(() => setTagLibrary([]))
    }
    if (activeTab === 'hot') {
      apiFetch<HotPrompt[]>(`/api/prompt/hot?category=${hotCategory}`).then(setHotPrompts).catch(() => setHotPrompts([]))
    }
  }, [activeTab, favCategory, favSearch, historyPeriod, hotCategory])

  // ==================== 标签页配置 ====================

  const tabs = [
    { id: 'generate', label: '生成', icon: Wand2 },
    { id: 'optimize', label: '优化', icon: ArrowUpCircle },
    { id: 'image', label: '图反推', icon: ImageIcon },
    { id: 'video', label: '视频反推', icon: Video },
    { id: 'lab', label: '实验室', icon: FlaskConical },
    { id: 'tags', label: '标签库', icon: Tag },
    { id: 'hot', label: '爆款', icon: Flame },
    { id: 'favorites', label: '收藏', icon: Heart },
    { id: 'history', label: '历史', icon: Clock },
  ]

  return (
    <Layout title="Prompt Studio" description="全平台AI提示词工作台 — 生成、优化、反推、收藏、管理">
      {/* 顶部标签导航 */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30 shadow-lg shadow-gold-500/5'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</span>
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
        </div>
      )}

      {/* ==================== 模块一：生成器 ==================== */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：输入面板 */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <h2 className="font-orbitron text-lg text-white mb-6 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-gold-500" /> Prompt 生成器
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* 平台选择 */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">目标平台</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {platforms.slice(0, 6).map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlatform(p.value)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        platform === p.value ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30' : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 主体 */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">主体描述</label>
                <textarea
                  ref={textareaRef}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="描述你想生成的画面主体，例如：一位身穿汉服的亚洲女性，站在樱花树下..."
                  className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-gold-500/50 transition-all resize-none h-24"
                />
              </div>

              {/* 风格 & 情绪 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">风格</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all">
                    {styles.map((s) => (<option key={s.value} value={s.value}>{s.icon} {s.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">情绪</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all">
                    <option value="">不指定</option>
                    <option value="dreamy">梦幻</option>
                    <option value="mysterious">神秘</option>
                    <option value="oppressive">压抑</option>
                    <option value="warm">温馨</option>
                    <option value="lonely">孤独</option>
                    <option value="epic">史诗感</option>
                  </select>
                </div>
              </div>

              {/* 镜头 & 光影 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> 镜头</label>
                  <select value={camera} onChange={(e) => setCamera(e.target.value)} className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all">
                    <option value="">不指定</option>
                    <option value="close-up">特写</option>
                    <option value="portrait">半身</option>
                    <option value="full-body">全身</option>
                    <option value="wide-angle">广角</option>
                    <option value="bird-view">鸟瞰</option>
                    <option value="pov">第一人称</option>
                    <option value="aerial">航拍</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1"><Sun className="w-3 h-3" /> 光影</label>
                  <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all">
                    <option value="">不指定</option>
                    <option value="cinematic">电影光</option>
                    <option value="backlight">逆光</option>
                    <option value="soft">柔光</option>
                    <option value="volumetric">体积光</option>
                    <option value="neon">霓虹光</option>
                    <option value="moonlight">月光</option>
                  </select>
                </div>
              </div>

              {/* 增强等级 */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-1"><Crown className="w-3 h-3 text-gold-500" /> 增强等级</label>
                <div className="grid grid-cols-3 gap-2">
                  {enhanceLevels.map((lvl) => (
                    <button key={lvl.value} type="button" onClick={() => setEnhanceLevel(lvl.value)}
                      className={`p-3 rounded-xl text-center transition-all border ${enhanceLevel === lvl.value ? 'bg-gold-500/20 border-gold-500/50 shadow-lg shadow-gold-500/10' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                      <span className="block text-xl mb-1">{lvl.icon}</span>
                      <span className={`block text-sm font-bold ${enhanceLevel === lvl.value ? 'text-gold-500' : 'text-gray-300'}`}>{lvl.label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{lvl.desc}</span>
                      {lvl.recommended && <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 text-xs">推荐</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* 模板驱动模式切换 */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold-500" />
                  <div>
                    <span className="text-sm text-white font-medium">模板驱动模式</span>
                    <p className="text-xs text-gray-500 mt-0.5">使用预设模板 + AI 润色，质量更稳定</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTemplate}
                    onChange={(e) => setUseTemplate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-gold-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              {/* 模型 & 语言 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">AI 模型</label>
                  <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-gray-900/50 border border-gold-500/20 rounded-xl px-4 py-3 text-white focus:border-gold-500/50 transition-all">
                    {modelOptions.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">输出语言</label>
                  <div className="flex rounded-xl overflow-hidden border border-gold-500/20">
                    <button type="button" onClick={() => setLanguage('cn')} className={`flex-1 py-3 text-sm font-medium transition-all ${language === 'cn' ? 'bg-gold-500 text-black' : 'bg-gray-900/50 text-gray-400 hover:text-white'}`}>中文</button>
                    <button type="button" onClick={() => setLanguage('en')} className={`flex-1 py-3 text-sm font-medium transition-all ${language === 'en' ? 'bg-gold-500 text-black' : 'bg-gray-900/50 text-gray-400 hover:text-white'}`}>English</button>
                  </div>
                </div>
              </div>

              {/* 提交 */}
              <button type="submit" disabled={loading || !subject.trim()}
                className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? '生成中...' : '生成 Prompt'}
              </button>
            </form>
          </div>

          {/* 右侧：结果面板 */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
            <h2 className="font-orbitron text-lg text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" /> 生成结果
            </h2>

            {!prompt && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-orbitron text-sm">AI 绘图提示词工厂 Pro</p>
                <p className="text-xs mt-2">输入主体描述，选择参数，开始生成</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-gold-500/30 animate-ping" />
                  <RefreshCw className="w-20 h-20 text-gold-500 animate-spin absolute inset-0 m-auto" />
                </div>
                <p className="text-gray-400 mt-6 text-sm">管道式引擎工作中...</p>
                <p className="text-gray-600 text-xs mt-1">主体识别 → 场景扩写 → 镜头构建 → 光影构建 → 材质构建 → 色彩构建 → 风格构建 → 平台适配</p>
              </div>
            )}

            {prompt && (
              <div className="space-y-4">
                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {editedTags.map((tag) => (
                    <PromptTag key={tag} label={tag} onRemove={() => removeTag(tag)} />
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="+ 标签"
                      className="w-16 bg-transparent border-b border-white/20 text-xs text-white px-1 py-0.5 focus:border-gold-500/50 outline-none"
                      onKeyDown={(e) => { if (e.key === 'Enter' && customTag) { addTag(customTag); setCustomTag('') } }}
                    />
                  </div>
                </div>

                {/* Prompt 文本框 */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={prompt.generated_prompt}
                    className="w-full bg-gray-900/80 border border-gold-500/20 rounded-xl p-4 text-sm text-white font-mono leading-relaxed resize-none h-40 focus:outline-none"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => copyToClipboard(prompt.generated_prompt)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title="复制">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => downloadTxt(prompt.generated_prompt, `prompt-${prompt.subject.slice(0, 20)}`)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title="下载TXT">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={saveFavorite} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title="收藏">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* 一键优化 */}
                {prompt.quality_score && prompt.quality_score.total < 85 && (
                  <button onClick={handleOptimize} disabled={optimizing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyber-blue/20 border border-purple-500/30 text-purple-400 hover:border-purple-500/50 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {optimizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                    {optimizing ? '正在优化...' : '一键优化 — 自动补充镜头、光影、材质、构图'}
                  </button>
                )}

                {/* 质量评分 */}
                {prompt.quality_score && <QualityScoreCard score={prompt.quality_score} />}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 模块二：优化器 ==================== */}
      {activeTab === 'optimize' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-purple-400" /> Prompt 优化器
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">输入原始 Prompt</label>
                <textarea
                  value={optInput}
                  onChange={(e) => setOptInput(e.target.value)}
                  placeholder="粘贴你的 Prompt..."
                  className="w-full bg-gray-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-purple-500/50 transition-all resize-none h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">平台</label>
                  <select value={optPlatform} onChange={(e) => setOptPlatform(e.target.value)} className="w-full bg-gray-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white">
                    {platforms.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">优化等级</label>
                  <select value={optLevel} onChange={(e) => setOptLevel(e.target.value)} className="w-full bg-gray-900/50 border border-purple-500/20 rounded-xl px-4 py-3 text-white">
                    <option value="basic">基础优化</option>
                    <option value="pro">专业优化</option>
                    <option value="master">大师优化</option>
                  </select>
                </div>
              </div>
              <button onClick={handleOptimizeStandalone} disabled={optimizing || !optInput.trim()}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {optimizing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowUpCircle className="w-5 h-5" />}
                {optimizing ? '优化中...' : '开始优化'}
              </button>
            </div>

            {optResult && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-xs text-gray-500">优化维度</p>
                <div className="flex flex-wrap gap-1.5">
                  {optResult.diff?.map((d, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">{d}</span>
                  ))}
                </div>
                <p className="text-sm text-gray-300">
                  评分提升：<span className="text-red-400">{optResult.improvement.originalScore}</span>
                  <ArrowRight className="inline w-3 h-3 mx-1" />
                  <span className="text-green-400">{optResult.improvement.optimizedScore}</span>
                  <span className="text-green-400 ml-1">(+{optResult.improvement.improvement})</span>
                </p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4">优化结果</h2>
            {optResult ? (
              <div className="space-y-3">
                <div className="relative">
                  <textarea readOnly value={optResult.optimized_prompt}
                    className="w-full bg-gray-900/80 border border-purple-500/20 rounded-xl p-4 text-sm text-white font-mono leading-relaxed resize-none h-48"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => copyToClipboard(optResult.optimized_prompt)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20">
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
                {optResult.quality_score && <QualityScoreCard score={optResult.quality_score} />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <ArrowUpCircle className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">输入 Prompt 并点击优化</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 模块三：图片反推 ==================== */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyber-blue" /> 图片反推
            </h2>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-gold-500/30 transition-all cursor-pointer"
              onClick={() => document.getElementById('image-upload')?.click()}>
              {uploadedImage ? (
                <img src={uploadedImage} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">点击上传图片</p>
                  <p className="text-gray-600 text-xs mt-1">支持 JPG、PNG、WebP</p>
                </>
              )}
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" /> 分析中...
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4">分析结果</h2>
            {imageAnalysis ? (
              <div className="space-y-3">
                {[
                  { label: '主体', value: imageAnalysis.subject },
                  { label: '构图', value: imageAnalysis.composition },
                  { label: '镜头', value: imageAnalysis.camera },
                  { label: '风格', value: imageAnalysis.style },
                  { label: '色彩', value: imageAnalysis.colors },
                  { label: '光影', value: imageAnalysis.lighting },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-white/5">
                    <span className="text-xs text-gold-500 font-medium">{item.label}</span>
                    <p className="text-sm text-gray-300 mt-1">{item.value}</p>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5">
                  {imageAnalysis.tags?.map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-gold-500/10 text-gold-400 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">上传图片后自动分析</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 模块四：视频反推 ==================== */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" /> 视频反推
            </h2>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/30 transition-all cursor-pointer"
              onClick={() => document.getElementById('video-upload')?.click()}>
              {videoFile ? (
                <div className="flex items-center gap-3 justify-center">
                  <Video className="w-8 h-8 text-purple-400" />
                  <span className="text-gray-300">{videoFile.name}</span>
                </div>
              ) : (
                <>
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">点击上传视频</p>
                  <p className="text-gray-600 text-xs mt-1">支持 MP4、MOV</p>
                </>
              )}
              <input id="video-upload" type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" /> 分析中...
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4">分析结果</h2>
            {videoAnalysis ? (
              <div className="space-y-3">
                {[
                  { label: '主体', value: videoAnalysis.subject },
                  { label: '镜头语言', value: videoAnalysis.shotTypes?.join(', ') },
                  { label: '运镜方式', value: videoAnalysis.cameraMovements?.join(', ') },
                  { label: '节奏', value: videoAnalysis.pacing },
                  { label: '转场', value: videoAnalysis.transitions?.join(', ') },
                  { label: '视觉风格', value: videoAnalysis.visualStyle },
                  { label: '色彩', value: videoAnalysis.colorPalette?.join(', ') },
                  { label: '情绪', value: videoAnalysis.mood },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-white/5">
                    <span className="text-xs text-purple-400 font-medium">{item.label}</span>
                    <p className="text-sm text-gray-300 mt-1">{item.value}</p>
                  </div>
                ))}
                {videoAnalysis.prompts && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">平台 Prompt</p>
                    {Object.entries(videoAnalysis.prompts).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-white/5 mb-2">
                        <span className="text-xs text-gold-500 font-medium">{k}</span>
                        <p className="text-xs text-gray-300 mt-1 font-mono">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Video className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">上传视频后自动分析</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 模块五：实验室 ==================== */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-green-400" /> Prompt 实验室
            </h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-gray-300 text-sm font-medium mb-2">主体描述</label>
                <input
                  value={labSubject}
                  onChange={(e) => setLabSubject(e.target.value)}
                  placeholder="输入一个主体，例如：古风美女"
                  className="w-full bg-gray-900/50 border border-green-500/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-green-500/50 transition-all"
                />
              </div>
              <div className="min-w-[150px]">
                <label className="block text-gray-300 text-sm font-medium mb-2">行业模式</label>
                <select value={labIndustry} onChange={(e) => setLabIndustry(e.target.value)} className="w-full bg-gray-900/50 border border-green-500/20 rounded-xl px-4 py-3 text-white">
                  <option value="">通用</option>
                  {industryModes.map((m) => (<option key={m.value} value={m.value}>{m.icon} {m.label}</option>))}
                </select>
              </div>
              <button onClick={handleLabGenerate} disabled={loading || !labSubject.trim()}
                className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                生成多风格变体
              </button>
            </div>
          </div>

          {labResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {labResult.variants.map((v, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-gold-500/30 transition-all group">
                  <div className="flex items-center gap-2 mb-3">
                    {labStyles.find((s) => s.value === v.style)?.icon && (
                      <span className="text-xl">{labStyles.find((s) => s.value === v.style)?.icon}</span>
                    )}
                    <h3 className="text-sm font-bold text-white">{v.label}</h3>
                  </div>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-6">{v.prompt}</p>
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => copyToClipboard(v.prompt)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 flex items-center justify-center gap-1">
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                    <button onClick={() => { setSubject(v.prompt); setActiveTab('generate') }} className="flex-1 py-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-xs text-gold-400 flex items-center justify-center gap-1">
                      <Edit3 className="w-3 h-3" /> 编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 模块六：标签库 ==================== */}
      {activeTab === 'tags' && (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold-500" /> Prompt 标签库
          </h2>
          <div className="mb-4">
            <input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="搜索标签..."
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-gold-500/50 transition-all"
            />
          </div>
          <div className="space-y-4">
            {tagLibrary
              .filter((cat) => !tagSearch || cat.tags.some((t) => t.toLowerCase().includes(tagSearch.toLowerCase())))
              .map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-gray-300">{cat.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags
                      .filter((t) => !tagSearch || t.toLowerCase().includes(tagSearch.toLowerCase()))
                      .map((tag) => (
                        <button
                          key={tag}
                          onClick={() => { setSubject((prev) => prev ? `${prev}, ${tag}` : tag); setActiveTab('generate') }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-gold-500/20 text-xs text-gray-400 hover:text-gold-400 border border-transparent hover:border-gold-500/20 transition-all cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ==================== 模块七：爆款广场 ==================== */}
      {activeTab === 'hot' && (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> 爆款 Prompt 广场
          </h2>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {['all', '国风', '动漫', '赛博朋克', '电商', '写真', '游戏', '海报', '科幻'].map((cat) => (
              <button
                key={cat}
                onClick={() => setHotCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${hotCategory === cat ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {cat === 'all' ? '全部' : cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotPrompts.map((hp) => (
              <div key={hp.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{hp.title}</h3>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Heart className="w-3 h-3" /> {hp.likes}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed line-clamp-3 mb-3">{hp.prompt}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {hp.tags.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-gray-500 text-xs">{t}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(hp.prompt)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" /> 复制
                  </button>
                  <button onClick={() => { setSubject(hp.prompt); setPlatform(hp.platform); setActiveTab('generate') }} className="flex-1 py-1.5 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-xs text-gold-400 flex items-center justify-center gap-1">
                    <Wand2 className="w-3 h-3" /> 套用
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 模块八：收藏夹 ==================== */}
      {activeTab === 'favorites' && (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" /> 我的收藏
          </h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                value={favSearch}
                onChange={(e) => setFavSearch(e.target.value)}
                placeholder="搜索收藏..."
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600"
              />
            </div>
            <select value={favCategory} onChange={(e) => setFavCategory(e.target.value)} className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white">
              {favoriteCategories.map((c) => (<option key={c} value={c === '全部' ? 'all' : c}>{c}</option>))}
            </select>
          </div>
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Heart className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm">暂无收藏</p>
              <p className="text-xs mt-1">生成 Prompt 后点击心形按钮收藏</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <div key={fav.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-pink-400 font-medium">{fav.platform}</span>
                      {fav.category && <span className="px-2 py-0.5 rounded bg-white/10 text-gray-500 text-xs">{fav.category}</span>}
                    </div>
                    <span className="text-xs text-gray-600">{new Date(fav.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono line-clamp-2 mb-2">{fav.prompt}</p>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(fav.prompt)} className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-gray-300 flex items-center justify-center gap-1">
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                    <button onClick={() => { setSubject(fav.prompt); setPlatform(fav.platform); setActiveTab('generate') }} className="flex-1 py-1.5 rounded-lg bg-gold-500/20 text-xs text-gold-400 flex items-center justify-center gap-1">
                      <Edit3 className="w-3 h-3" /> 编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== 模块九：历史记录 ==================== */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <h2 className="font-orbitron text-lg text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyber-blue" /> 生成历史
          </h2>
          <div className="flex gap-2 mb-4">
            {['all', 'today', 'yesterday', 'week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setHistoryPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyPeriod === p ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              >
                {p === 'all' ? '全部' : p === 'today' ? '今天' : p === 'yesterday' ? '昨天' : p === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
          {historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <History className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyItems.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-300">{item.title}</p>
                    <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {item.metadata?.prompt_id && (
                      <button
                        onClick={() => {
                          apiFetch<Prompt>(`/api/prompt/generate?id=${item.metadata.prompt_id}`).then((data) => {
                            setPrompt(data); setActiveTab('generate')
                          }).catch(() => {})
                        }}
                        className="px-2 py-1 rounded bg-white/10 text-xs text-gray-400 hover:text-white"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

// FlaskConical icon fallback
function FlaskConical(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
      <path d="M10 2h4" />
    </svg>
  )
}