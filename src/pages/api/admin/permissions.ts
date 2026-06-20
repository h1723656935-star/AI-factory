// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createServiceClient, createAdminClient } from '@/lib/supabase'
import { withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { hasPermission, PERMISSIONS, getUserPermissions, PERMISSION_INFO } from '@/lib/permissions'

const supabase = createServiceClient()
const adminSupabase = createAdminClient()

// ==================== 权限管理 API ====================

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req
  const userId = req.headers['x-user-id'] as string

  // 验证管理员权限
  if (userId) {
    const isAdmin = await hasPermission(userId, PERMISSIONS.SYSTEM_ADMIN)
    if (!isAdmin) {
      return errorResponse(res, '需要管理员权限', 403)
    }
  }

  // ===== 获取所有权限定义 =====
  if (query.action === 'list' && method === 'GET') {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category')
      .order('id')

    if (error) return errorResponse(res, '获取权限列表失败', 500)

    return successResponse(res, data)
  }

  // ===== 获取角色权限 =====
  if (query.action === 'roles' && method === 'GET') {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('role, permission_id, permissions(name, category)')

    if (error) return errorResponse(res, '获取角色权限失败', 500)

    // 按角色分组
    const rolePerms: Record<string, string[]> = {}
    ;(data || []).forEach((rp: any) => {
      if (!rolePerms[rp.role]) rolePerms[rp.role] = []
      rolePerms[rp.role].push(rp.permission_id)
    })

    return successResponse(res, rolePerms)
  }

  // ===== 获取用户权限 =====
  if (query.action === 'user' && method === 'GET') {
    const targetUserId = query.user_id as string
    if (!targetUserId) return errorResponse(res, 'user_id is required', 400)

    const permissions = await getUserPermissions(targetUserId)

    // 获取用户角色
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, email')
      .eq('id', targetUserId)
      .single()

    return successResponse(res, {
      user: profile,
      permissions,
    })
  }

  // ===== 授予用户权限 =====
  if (query.action === 'grant' && method === 'POST') {
    const { user_id, permission_id, reason } = req.body
    if (!user_id || !permission_id) {
      return errorResponse(res, 'user_id and permission_id are required', 400)
    }

    const { error } = await supabase
      .from('user_permissions')
      .upsert({
        user_id,
        permission_id,
        granted: true,
        reason,
        granted_by: userId,
      })

    if (error) return errorResponse(res, '授予权限失败', 500)

    return successResponse(res, { granted: true })
  }

  // ===== 撤销用户权限 =====
  if (query.action === 'revoke' && method === 'POST') {
    const { user_id, permission_id } = req.body
    if (!user_id || !permission_id) {
      return errorResponse(res, 'user_id and permission_id are required', 400)
    }

    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', user_id)
      .eq('permission_id', permission_id)

    if (error) return errorResponse(res, '撤销权限失败', 500)

    return successResponse(res, { revoked: true })
  }

  // ===== 更新角色权限 =====
  if (query.action === 'update-role' && method === 'POST') {
    const { role, permissions } = req.body
    if (!role || !Array.isArray(permissions)) {
      return errorResponse(res, 'role and permissions array are required', 400)
    }

    // 删除现有权限
    await supabase.from('role_permissions').delete().eq('role', role)

    // 插入新权限
    if (permissions.length > 0) {
      const inserts = permissions.map((p: string) => ({ role, permission_id: p }))
      const { error } = await supabase.from('role_permissions').insert(inserts)
      if (error) return errorResponse(res, '更新角色权限失败', 500)
    }

    return successResponse(res, { updated: true, count: permissions.length })
  }

  // ===== 检查权限 =====
  if (query.action === 'check' && method === 'GET') {
    const targetUserId = query.user_id as string
    const permissionId = query.permission_id as string

    if (!targetUserId || !permissionId) {
      return errorResponse(res, 'user_id and permission_id are required', 400)
    }

    const allowed = await hasPermission(targetUserId, permissionId as any)

    return successResponse(res, { allowed })
  }

  return errorResponse(res, 'Invalid action', 400)
}

export default withErrorHandler(handler)
