// @ts-nocheck
import { useState, useEffect } from 'react'
import {
  Users, Search, Shield, RefreshCw, X, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Edit3, Key, Ban, UserCheck,
  Eye, EyeOff, Crown, Star, Zap, Building, User,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { apiFetch } from '@/lib/api-client'
import { PERMISSIONS, PERMISSION_INFO } from '@/lib/permissions'

// 角色配置
const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  free: { label: '免费用户', color: 'text-gray-400', icon: User },
  basic: { label: '基础会员', color: 'text-blue-400', icon: Star },
  premium: { label: '高级会员', color: 'text-purple-400', icon: Zap },
  enterprise: { label: '企业用户', color: 'text-gold-400', icon: Building },
  admin: { label: '管理员', color: 'text-red-400', icon: Crown },
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

interface UserPermission {
  permission_id: string
  permission_name: string
  source: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('')

  // 分页
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // 权限面板
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [showPermissionPanel, setShowPermissionPanel] = useState(false)
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  // 编辑角色
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')

  const loadUsers = async (pageNum = 1) => {
    setLoading(true)
    setError('')
    try {
      // 这里需要实现用户列表 API
      // 暂时使用 profiles 表
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      let query = supabase
        .from('profiles')
        .select('id, email, name, avatar_url, role, created_at, updated_at', { count: 'exact' })

      if (filterRole) {
        query = query.eq('role', filterRole)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * 20, pageNum * 20 - 1)

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / 20))
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1)
  }, [filterRole])

  const loadUserPermissions = async (userId: string) => {
    setPermissionsLoading(true)
    try {
      const data = await apiFetch(`/api/admin/permissions?action=user&user_id=${userId}`)
      setUserPermissions(data.permissions || [])
    } catch (err) {
      console.error('Load permissions error:', err)
    } finally {
      setPermissionsLoading(false)
    }
  }

  const handleViewPermissions = async (user: UserProfile) => {
    setSelectedUser(user)
    setShowPermissionPanel(true)
    await loadUserPermissions(user.id)
  }

  const handleGrantPermission = async (permissionId: string) => {
    if (!selectedUser) return
    try {
      await apiFetch('/api/admin/permissions?action=grant', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          permission_id: permissionId,
          reason: '管理员授予',
        }),
      })
      await loadUserPermissions(selectedUser.id)
    } catch (err) {
      setError('授予权限失败')
    }
  }

  const handleRevokePermission = async (permissionId: string) => {
    if (!selectedUser) return
    try {
      await apiFetch('/api/admin/permissions?action=revoke', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          permission_id: permissionId,
        }),
      })
      await loadUserPermissions(selectedUser.id)
    } catch (err) {
      setError('撤销权限失败')
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      // 这里需要实现更新用户角色的 API
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      setEditingUserId(null)
      loadUsers(page)
    } catch (err) {
      setError('更新角色失败')
    }
  }

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const userPermissionIds = new Set(userPermissions.map((p) => p.permission_id))

  return (
    <Layout title="用户管理" description="管理用户和权限">
      <div className="max-w-7xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-orbitron text-2xl text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-gold-500" />
              用户管理
            </h1>
            <p className="text-gray-500 text-sm mt-1">管理系统用户和权限分配</p>
          </div>
          <button
            onClick={() => loadUsers(page)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索用户名或邮箱..."
              className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:border-gold-500/50 transition-all"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
          >
            <option value="">所有角色</option>
            {Object.entries(roleConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
            <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {error}</span>
            <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
          </div>
        )}

        {/* 用户列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-gold-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">暂无用户</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => {
              const roleInfo = roleConfig[user.role] || roleConfig.free
              const RoleIcon = roleInfo.icon
              const isEditing = editingUserId === user.id

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-gold-500/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 头像 */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-purple-500/20 flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>

                      {/* 用户信息 */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{user.name || '未设置昵称'}</span>
                          {isEditing ? (
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="bg-gray-900 border border-white/20 rounded px-2 py-0.5 text-sm text-white"
                            >
                              {Object.entries(roleConfig).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs ${roleInfo.color} bg-white/5 flex items-center gap-1`}>
                              <RoleIcon className="w-3 h-3" /> {roleInfo.label}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <p className="text-gray-600 text-xs mt-0.5">注册于 {formatDate(user.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleUpdateRole(user.id, newRole)}
                            className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:text-white"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewPermissions(user)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                            title="查看权限"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingUserId(user.id); setNewRole(user.role) }}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                            title="编辑角色"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => { setPage(page - 1); loadUsers(page - 1) }}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="px-4 py-2 text-sm text-gray-400">
              第 {page} / {totalPages} 页
            </span>

            <button
              onClick={() => { setPage(page + 1); loadUsers(page + 1) }}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 权限面板 */}
        {showPermissionPanel && selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowPermissionPanel(false)}>
            <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-orbitron text-lg text-white">用户权限</h3>
                  <p className="text-gray-500 text-sm mt-1">{selectedUser.name || selectedUser.email}</p>
                </div>
                <button onClick={() => setShowPermissionPanel(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 text-gold-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 按分类分组显示权限 */}
                    {['template', 'prompt', 'user', 'system'].map((category) => {
                      const categoryPerms = Object.entries(PERMISSION_INFO).filter(([, info]) => info.category === category)
                      if (categoryPerms.length === 0) return null

                      const categoryLabels: Record<string, string> = {
                        template: '模板权限',
                        prompt: '提示词权限',
                        user: '用户管理权限',
                        system: '系统权限',
                      }

                      return (
                        <div key={category}>
                          <h4 className="text-gray-400 text-sm font-medium mb-2">{categoryLabels[category]}</h4>
                          <div className="space-y-1">
                            {categoryPerms.map(([permId, permInfo]) => {
                              const hasPermission = userPermissionIds.has(permId)

                              return (
                                <div
                                  key={permId}
                                  className={`p-3 rounded-xl flex items-center justify-between ${hasPermission ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/[0.02] border border-white/5'}`}
                                >
                                  <div>
                                    <p className="text-white text-sm">{permInfo.name}</p>
                                    <p className="text-gray-500 text-xs">{permInfo.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {permInfo.dangerous && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400">危险</span>
                                    )}
                                    {hasPermission ? (
                                      <button
                                        onClick={() => handleRevokePermission(permId)}
                                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20"
                                      >
                                        撤销
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleGrantPermission(permId)}
                                        className="px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/20"
                                      >
                                        授予
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
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
