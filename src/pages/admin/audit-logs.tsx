// @ts-nocheck
import { useState, useEffect } from 'react'
import {
  Shield, Search, Filter, RefreshCw, Download, Eye, X,
  Calendar, User, Activity, AlertTriangle, CheckCircle,
  Clock, Server, ChevronLeft, ChevronRight, Trash,
  Edit, FileJson, LogOut, LogIn, CreditCard, Settings,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { apiFetch } from '@/lib/api-client'

// 操作类型配置
const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  login: { label: '登录', color: 'text-green-400', icon: LogIn },
  logout: { label: '登出', color: 'text-gray-400', icon: LogOut },
  create: { label: '创建', color: 'text-blue-400', icon: CheckCircle },
  update: { label: '更新', color: 'text-yellow-400', icon: Edit },
  delete: { label: '删除', color: 'text-red-400', icon: Trash },
  export: { label: '导出', color: 'text-purple-400', icon: Download },
  import: { label: '导入', color: 'text-cyan-400', icon: FileJson },
  payment: { label: '支付', color: 'text-gold-400', icon: CreditCard },
  admin: { label: '管理', color: 'text-pink-400', icon: Settings },
  batch_delete: { label: '批量删除', color: 'text-red-400', icon: Trash },
  batch_update: { label: '批量更新', color: 'text-yellow-400', icon: Edit },
  template_version_create: { label: '创建版本', color: 'text-blue-400', icon: FileJson },
  template_version_rollback: { label: '版本回滚', color: 'text-orange-400', icon: RefreshCw },
}

// 资源类型配置
const resourceConfig: Record<string, string> = {
  video_analysis: '视频分析',
  script: '脚本',
  storyboard: '分镜',
  prompt: '提示词',
  template: '模板',
  subscription: '订阅',
  profile: '用户资料',
  user: '用户',
}

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
  user_name?: string
  user_email?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState<{ actions: Record<string, number>; resources: Record<string, number> }>({ actions: {}, resources: {} })

  // 筛选条件
  const [filterAction, setFilterAction] = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 详情模态框
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const loadLogs = async (page = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', pagination.limit.toString())
      if (filterAction) params.set('action', filterAction)
      if (filterResource) params.set('resource_type', filterResource)
      if (filterUserId) params.set('user_id', filterUserId)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const data = await apiFetch(`/api/admin/audit-logs?${params}`)
      setLogs(data.logs || [])
      setPagination(data.pagination)
      setStats(data.stats || { actions: {}, resources: {} })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs(1)
  }, [filterAction, filterResource, filterUserId, startDate, endDate])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '1000')
      if (filterAction) params.set('action', filterAction)
      if (filterResource) params.set('resource_type', filterResource)
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const data = await apiFetch(`/api/admin/audit-logs?${params}`)
      const exportData = data.logs.map((log: AuditLog) => ({
        时间: new Date(log.created_at).toLocaleString(),
        用户: log.user_name || '匿名',
        操作: actionConfig[log.action]?.label || log.action,
        资源类型: resourceConfig[log.resource_type || ''] || log.resource_type || '-',
        资源ID: log.resource_id || '-',
        IP地址: log.ip_address || '-',
        详情: JSON.stringify(log.metadata),
      }))

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('导出失败')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionIcon = (action: string) => {
    const config = actionConfig[action]
    if (!config) return <Activity className="w-4 h-4" />
    const Icon = config.icon
    return <Icon className={`w-4 h-4 ${config.color}`} />
  }

  const totalActions = Object.values(stats.actions).reduce((a, b) => a + b, 0)

  return (
    <Layout title="审计日志" description="系统操作审计记录">
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-gold-500" />
              审计日志
            </h1>
            <p className="text-gray-500 text-sm mt-1">系统操作记录与安全审计</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => loadLogs(pagination.page)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新
            </button>
            <button onClick={handleExport} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> 导出
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-gray-500 text-xs mb-1">总记录数</p>
            <p className="text-2xl font-bold text-white">{pagination.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-gray-500 text-xs mb-1">近7天操作</p>
            <p className="text-2xl font-bold text-gold-500">{totalActions}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-gray-500 text-xs mb-1">最频繁操作</p>
            <p className="text-lg font-bold text-blue-400">
              {Object.entries(stats.actions).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-gray-500 text-xs mb-1">最活跃资源</p>
            <p className="text-lg font-bold text-purple-400">
              {Object.entries(stats.resources).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
            </p>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="">所有操作</option>
            {Object.entries(actionConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="">所有资源</option>
            {Object.entries(resourceConfig).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
            placeholder="开始日期"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
            placeholder="结束日期"
          />

          <input
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder="用户ID筛选"
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm w-40"
          />

          <button
            onClick={() => { setFilterAction(''); setFilterResource(''); setFilterUserId(''); setStartDate(''); setEndDate('') }}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-sm"
          >
            重置筛选
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</span>
            <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
          </div>
        )}

        {/* 日志列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Shield className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">暂无审计日志</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const actionInfo = actionConfig[log.action] || { label: log.action, color: 'text-gray-400' }
              const resourceLabel = resourceConfig[log.resource_type || ''] || log.resource_type || '-'

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-gold-500/20 transition-all cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 操作图标 */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        {getActionIcon(log.action)}
                      </div>

                      {/* 主要信息 */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${actionInfo.color}`}>{actionInfo.label}</span>
                          <span className="text-gray-600">·</span>
                          <span className="text-gray-400 text-sm">{resourceLabel}</span>
                          {log.resource_id && (
                            <>
                              <span className="text-gray-600">·</span>
                              <span className="text-gray-500 text-xs font-mono">{log.resource_id.slice(0, 8)}...</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {log.user_name || '匿名'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(log.created_at)}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1">
                              <Server className="w-3 h-3" /> {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => loadLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="px-4 py-2 text-sm text-gray-400">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>

            <button
              onClick={() => loadLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 详情模态框 */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-orbitron text-lg text-white">操作详情</h3>
                <button onClick={() => setSelectedLog(null)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">操作类型</p>
                    <p className={`font-medium ${actionConfig[selectedLog.action]?.color || 'text-gray-400'}`}>
                      {actionConfig[selectedLog.action]?.label || selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">资源类型</p>
                    <p className="text-white">{resourceConfig[selectedLog.resource_type || ''] || selectedLog.resource_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">操作用户</p>
                    <p className="text-white">{selectedLog.user_name || '匿名'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">用户邮箱</p>
                    <p className="text-gray-400">{selectedLog.user_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">资源 ID</p>
                    <p className="text-white font-mono text-sm">{selectedLog.resource_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">IP 地址</p>
                    <p className="text-white font-mono text-sm">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs mb-1">操作时间</p>
                    <p className="text-white">{formatDate(selectedLog.created_at)}</p>
                  </div>
                </div>

                {selectedLog.user_agent && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">User-Agent</p>
                    <p className="text-gray-400 text-xs font-mono break-all">{selectedLog.user_agent}</p>
                  </div>
                )}

                {Object.keys(selectedLog.metadata || {}).length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs mb-2">元数据</p>
                    <pre className="p-4 rounded-xl bg-black/30 text-gray-300 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
