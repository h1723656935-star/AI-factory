// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, Edit3, Save, X, Download, Upload, RefreshCw,
  Search, Filter, Layers, Copy, Check, FileJson, Package, RotateCcw,
  AlertCircle, ChevronDown, Grid3X3, List, Eye, EyeOff, BookOpen,
} from 'lucide-react'
import Layout from '@/components/Layout'
import { apiFetch } from '@/lib/api-client'
import type { PromptTemplate, TemplateCategory } from '@/types'

const platforms = [
  { value: 'midjourney', label: 'Midjourney', color: 'text-blue-400' },
  { value: 'flux', label: 'Flux', color: 'text-purple-400' },
  { value: 'stable-diffusion', label: 'SDXL', color: 'text-orange-400' },
  { value: 'jimeng', label: '即梦', color: 'text-pink-400' },
  { value: 'keling', label: '可灵', color: 'text-green-400' },
  { value: 'dalle', label: 'DALL·E', color: 'text-teal-400' },
  { value: 'leonardo', label: 'Leonardo', color: 'text-cyan-400' },
  { value: 'comfyui', label: 'ComfyUI', color: 'text-yellow-400' },
  { value: 'fooocus', label: 'Fooocus', color: 'text-rose-400' },
]

const styles = [
  'cinematic', 'anime', 'realistic', 'cyberpunk', 'fantasy', 'watercolor',
  'oil-painting', '3d-render', 'comic', 'sketch', 'surreal', 'gothic',
  'vintage', 'noir', 'minimal', 'pixel-art',
]

const categories = ['人像', '场景', '动漫', '电商', '艺术', '电影', '3D', '摄影', '视频', '设计', 'general']

const emptyTemplate: Omit<PromptTemplate, 'id' | 'created_at' | 'useCount'> = {
  name: '',
  platform: 'midjourney',
  style: 'cinematic',
  category: 'general',
  template: '',
  description: '',
  aspectRatio: '16:9',
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [categories_, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 筛选
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStyle, setFilterStyle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 编辑
  const [editing, setEditing] = useState<PromptTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<typeof emptyTemplate>({ ...emptyTemplate })
  const [saving, setSaving] = useState(false)

  // 预览
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ==================== 数据加载 ====================

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterPlatform) params.set('platform', filterPlatform)
      if (filterStyle) params.set('style', filterStyle)
      const data = await apiFetch<PromptTemplate[]>(`/api/prompt/templates?${params}`)
      setTemplates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally { setLoading(false) }
  }

  const loadCategories = async () => {
    try {
      const data = await apiFetch<TemplateCategory[]>('/api/prompt/templates?action=categories')
      setCategories(data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadTemplates(); loadCategories() }, [filterPlatform, filterStyle])

  // ==================== 增删改 ====================

  const handleCreate = async () => {
    if (!form.name || !form.template) return
    setSaving(true); setError('')
    try {
      await apiFetch('/api/prompt/templates', { method: 'POST', body: JSON.stringify(form) })
      setSuccess('模板创建成功')
      setShowForm(false); setForm({ ...emptyTemplate })
      loadTemplates(); loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally { setSaving(false); setTimeout(() => setSuccess(''), 3000) }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setSaving(true); setError('')
    try {
      await apiFetch('/api/prompt/templates', {
        method: 'PUT',
        body: JSON.stringify({ id: editing.id, ...form }),
      })
      setSuccess('模板更新成功')
      setEditing(null); setShowForm(false)
      loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally { setSaving(false); setTimeout(() => setSuccess(''), 3000) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此模板？')) return
    try {
      await apiFetch('/api/prompt/templates', { method: 'DELETE', body: JSON.stringify({ id }) })
      setSuccess('模板已删除')
      loadTemplates(); loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally { setTimeout(() => setSuccess(''), 3000) }
  }

  const handleEdit = (tpl: PromptTemplate) => {
    setEditing(tpl); setShowForm(true)
    setForm({ name: tpl.name, platform: tpl.platform, style: tpl.style, category: tpl.category, template: tpl.template, description: tpl.description || '', aspectRatio: tpl.aspectRatio || '' })
  }

  const handleNew = () => {
    setEditing(null); setShowForm(true)
    setForm({ ...emptyTemplate })
  }

  // ==================== 导入导出 ====================

  const handleExport = async () => {
    try {
      const params = filterPlatform ? `?action=export&platform=${filterPlatform}` : '?action=export'
      const data = await apiFetch<PromptTemplate[]>(`/api/prompt/templates${params}`)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `prompt-templates-${filterPlatform || 'all'}.json`; a.click()
      URL.revokeObjectURL(url)
      setSuccess('模板导出成功')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const templates = JSON.parse(text)
      if (!Array.isArray(templates)) throw new Error('格式错误：需要 JSON 数组')
      const data = await apiFetch<{ imported: number }>('/api/prompt/templates?action=import', {
        method: 'POST',
        body: JSON.stringify({ templates }),
      })
      setSuccess(`导入成功：${data?.imported || templates.length} 个模板`)
      loadTemplates(); loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally { setTimeout(() => setSuccess(''), 3000); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleReset = async () => {
    if (!confirm('确定重置为默认模板？这将删除所有自定义模板。')) return
    try {
      await apiFetch('/api/prompt/templates?action=reset', { method: 'POST' })
      setSuccess('已重置为默认模板')
      loadTemplates(); loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
    } finally { setTimeout(() => setSuccess(''), 3000) }
  }

  // ==================== 筛选 ====================

  const filteredTemplates = templates.filter((t) => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) && !t.template.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const platformCounts = platforms.map((p) => ({ ...p, count: templates.filter((t) => t.platform === p.value).length }))

  return (
    <Layout title="模板管理" description="管理 Prompt 生成模板">
      <div className="max-w-7xl mx-auto">
        {/* 顶栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl text-white">模板管理后台</h1>
            <p className="text-gray-500 text-sm mt-1">管理 Prompt 生成模板，支持增删改查、导入导出</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> 导出
            </button>
            <label className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> 导入
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleReset} className="px-4 py-2 rounded-xl bg-white/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" /> 重置
            </button>
            <button onClick={handleNew} className="px-4 py-2 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> 新建模板
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</span>
            <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {success}</span>
            <X className="w-4 h-4 cursor-pointer" onClick={() => setSuccess('')} />
          </div>
        )}

        {/* 平台统计卡片 */}
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
          {platformCounts.map((p) => (
            <button
              key={p.value}
              onClick={() => setFilterPlatform(filterPlatform === p.value ? '' : p.value)}
              className={`p-3 rounded-xl text-center transition-all border ${
                filterPlatform === p.value ? 'bg-gold-500/10 border-gold-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <p className={`text-lg font-bold ${p.color}`}>{p.count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.label}</p>
            </button>
          ))}
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板名称或内容..."
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-gold-500/50 transition-all"
            />
          </div>
          <select
            value={filterStyle}
            onChange={(e) => setFilterStyle(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="">所有风格</option>
            {styles.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        {/* 新建/编辑表单 */}
        {showForm && (
          <div className="mb-6 p-6 rounded-2xl bg-white/[0.03] border border-gold-500/30 backdrop-blur-sm">
            <h3 className="font-orbitron text-lg text-white mb-4">
              {editing ? '编辑模板' : '新建模板'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">模板名称 *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：电影感人像"
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-gold-500/50" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">平台 *</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as any })}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                  {platforms.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">风格 *</label>
                <select value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                  {styles.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">分类</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                  {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">
                模板内容 *
                <span className="text-gray-600 text-xs ml-2">支持占位符：{'{subject}'}, {'{scene}'}, {'{lighting}'}, {'{camera}'}, {'{quality}'}, {'{style}'}, {'{mood}'}, {'{details}'}</span>
              </label>
              <textarea
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                placeholder="输入模板内容，使用 {subject} 等占位符..."
                className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:border-gold-500/50 transition-all resize-none h-28 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">描述</label>
                <input value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="模板用途说明"
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">宽高比</label>
                <input value={form.aspectRatio || ''} onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
                  placeholder="例如：16:9"
                  className="w-full bg-gray-900/50 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={editing ? handleUpdate : handleCreate} disabled={saving || !form.name || !form.template}
                className="px-6 py-2.5 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-all disabled:opacity-30 flex items-center gap-2 text-sm">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? '保存修改' : '创建模板'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-6 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all text-sm">
                取消
              </button>
            </div>
          </div>
        )}

        {/* 模板列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Layers className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">暂无模板</p>
            <p className="text-xs mt-1">点击"新建模板"或"重置"来添加默认模板</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((tpl) => {
              const platformInfo = platforms.find((p) => p.value === tpl.platform)
              const isPreview = previewId === tpl.id
              return (
                <div key={tpl.id} className="rounded-2xl bg-white/[0.03] border border-white/10 hover:border-gold-500/20 transition-all overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-bold text-white truncate">{tpl.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformInfo?.color || 'text-gray-400'} bg-white/5`}>
                            {platformInfo?.label || tpl.platform}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs text-gray-500 bg-white/5">{tpl.style}</span>
                          <span className="px-2 py-0.5 rounded text-xs text-gray-500 bg-white/5">{tpl.category}</span>
                          {tpl.useCount ? <span className="text-xs text-gray-600">使用 {tpl.useCount} 次</span> : null}
                        </div>
                        {tpl.description && <p className="text-xs text-gray-500 mb-2">{tpl.description}</p>}
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPreviewId(isPreview ? null : tpl.id)}
                            className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400 transition-all">
                            {isPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isPreview ? '收起' : '预览模板'}
                          </button>
                          <span className="text-gray-700">|</span>
                          <button onClick={() => handleEdit(tpl)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-all">
                            <Edit3 className="w-3 h-3" /> 编辑
                          </button>
                          <span className="text-gray-700">|</span>
                          <button onClick={() => handleDelete(tpl.id)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-all">
                            <Trash2 className="w-3 h-3" /> 删除
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {tpl.aspectRatio && (
                          <span className="px-2 py-1 rounded bg-white/5 text-gray-500 text-xs font-mono">{tpl.aspectRatio}</span>
                        )}
                        <button onClick={() => { navigator.clipboard.writeText(tpl.template); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-all" title="复制模板">
                          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                      </div>
                    </div>

                    {/* 预览 */}
                    {isPreview && (
                      <div className="mt-4 p-4 rounded-xl bg-gray-900/50 border border-gold-500/20">
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{tpl.template}</pre>
                        <div className="mt-2 text-xs text-gray-600">
                          占位符将被替换为：{'{subject}'}→主体 | {'{scene}'}→场景 | {'{lighting}'}→光影 | {'{camera}'}→镜头 | {'{quality}'}→画质
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}