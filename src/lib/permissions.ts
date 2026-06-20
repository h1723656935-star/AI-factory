// @ts-nocheck
/**
 * 权限检查中间件和工具函数
 */

import { createServiceClient } from './supabase'

const supabase = createServiceClient()

// ==================== 权限定义 ====================

export const PERMISSIONS = {
  // 模板权限
  TEMPLATE_VIEW: 'template:view',
  TEMPLATE_CREATE: 'template:create',
  TEMPLATE_UPDATE: 'template:update',
  TEMPLATE_DELETE: 'template:delete',
  TEMPLATE_EXPORT: 'template:export',
  TEMPLATE_IMPORT: 'template:import',
  TEMPLATE_VERSION: 'template:version',
  TEMPLATE_BATCH: 'template:batch',

  // 提示词权限
  PROMPT_GENERATE: 'prompt:generate',
  PROMPT_OPTIMIZE: 'prompt:optimize',
  PROMPT_VIDEO_ANALYSIS: 'prompt:video_analysis',
  PROMPT_UNLIMITED: 'prompt:unlimited',

  // 用户管理权限
  USER_VIEW: 'user:view',
  USER_UPDATE: 'user:update',
  USER_ROLE: 'user:role',
  USER_BAN: 'user:ban',

  // 系统管理权限
  SYSTEM_AUDIT: 'system:audit',
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_ADMIN: 'system:admin',
} as const

export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ==================== 权限检查函数 ====================

/**
 * 检查用户是否拥有指定权限
 */
export async function hasPermission(userId: string, permissionId: PermissionId): Promise<boolean> {
  if (!userId) return false

  try {
    const { data, error } = await supabase.rpc('user_has_permission', {
      p_user_id: userId,
      p_permission_id: permissionId,
    })

    if (error) {
      console.error('Permission check error:', error)
      return false
    }

    return data === true
  } catch (err) {
    console.error('Permission check error:', err)
    return false
  }
}

/**
 * 批量检查用户权限
 */
export async function checkPermissions(
  userId: string,
  permissionIds: PermissionId[]
): Promise<Record<string, boolean>> {
  if (!userId) {
    return Object.fromEntries(permissionIds.map(id => [id, false]))
  }

  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Permission check error:', error)
      return Object.fromEntries(permissionIds.map(id => [id, false]))
    }

    const userPermissions = new Set((data || []).map((p: any) => p.permission_id))

    return Object.fromEntries(
      permissionIds.map(id => [id, userPermissions.has(id)])
    )
  } catch (err) {
    console.error('Permission check error:', err)
    return Object.fromEntries(permissionIds.map(id => [id, false]))
  }
}

/**
 * 获取用户所有权限
 */
export async function getUserPermissions(userId: string): Promise<{ id: string; name: string; source: string }[]> {
  if (!userId) return []

  try {
    const { data, error } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Get permissions error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Get permissions error:', err)
    return []
  }
}

// ==================== 权限中间件 ====================

/**
 * API 权限检查中间件
 * 用法：withPermission(handler, PERMISSIONS.TEMPLATE_DELETE)
 */
export function withPermission(
  handler: (req: any, res: any) => Promise<void>,
  permission: PermissionId
) {
  return async (req: any, res: any) => {
    // 从请求中获取用户ID（需要先经过认证中间件）
    const userId = req.userId || req.headers['x-user-id']

    if (!userId) {
      return res.status(401).json({ error: '未登录' })
    }

    const allowed = await hasPermission(userId, permission)

    if (!allowed) {
      return res.status(403).json({ error: '权限不足' })
    }

    return handler(req, res)
  }
}

// ==================== 角色权限预设 ====================

export const ROLE_PERMISSIONS: Record<string, PermissionId[]> = {
  free: [
    PERMISSIONS.TEMPLATE_VIEW,
    PERMISSIONS.PROMPT_GENERATE,
    PERMISSIONS.PROMPT_OPTIMIZE,
  ],
  basic: [
    PERMISSIONS.TEMPLATE_VIEW,
    PERMISSIONS.TEMPLATE_CREATE,
    PERMISSIONS.TEMPLATE_UPDATE,
    PERMISSIONS.TEMPLATE_EXPORT,
    PERMISSIONS.PROMPT_GENERATE,
    PERMISSIONS.PROMPT_OPTIMIZE,
    PERMISSIONS.PROMPT_VIDEO_ANALYSIS,
  ],
  premium: [
    PERMISSIONS.TEMPLATE_VIEW,
    PERMISSIONS.TEMPLATE_CREATE,
    PERMISSIONS.TEMPLATE_UPDATE,
    PERMISSIONS.TEMPLATE_DELETE,
    PERMISSIONS.TEMPLATE_EXPORT,
    PERMISSIONS.TEMPLATE_IMPORT,
    PERMISSIONS.TEMPLATE_VERSION,
    PERMISSIONS.PROMPT_GENERATE,
    PERMISSIONS.PROMPT_OPTIMIZE,
    PERMISSIONS.PROMPT_VIDEO_ANALYSIS,
  ],
  enterprise: [
    PERMISSIONS.TEMPLATE_VIEW,
    PERMISSIONS.TEMPLATE_CREATE,
    PERMISSIONS.TEMPLATE_UPDATE,
    PERMISSIONS.TEMPLATE_DELETE,
    PERMISSIONS.TEMPLATE_EXPORT,
    PERMISSIONS.TEMPLATE_IMPORT,
    PERMISSIONS.TEMPLATE_VERSION,
    PERMISSIONS.TEMPLATE_BATCH,
    PERMISSIONS.PROMPT_GENERATE,
    PERMISSIONS.PROMPT_OPTIMIZE,
    PERMISSIONS.PROMPT_VIDEO_ANALYSIS,
    PERMISSIONS.PROMPT_UNLIMITED,
  ],
  admin: Object.values(PERMISSIONS), // 管理员拥有所有权限
}

// ==================== 权限描述 ====================

export const PERMISSION_INFO: Record<PermissionId, { name: string; description: string; category: string; dangerous: boolean }> = {
  // 模板权限
  [PERMISSIONS.TEMPLATE_VIEW]: { name: '查看模板', description: '查看模板列表和详情', category: 'template', dangerous: false },
  [PERMISSIONS.TEMPLATE_CREATE]: { name: '创建模板', description: '创建新的模板', category: 'template', dangerous: false },
  [PERMISSIONS.TEMPLATE_UPDATE]: { name: '更新模板', description: '修改现有模板', category: 'template', dangerous: false },
  [PERMISSIONS.TEMPLATE_DELETE]: { name: '删除模板', description: '删除模板', category: 'template', dangerous: true },
  [PERMISSIONS.TEMPLATE_EXPORT]: { name: '导出模板', description: '导出模板数据', category: 'template', dangerous: false },
  [PERMISSIONS.TEMPLATE_IMPORT]: { name: '导入模板', description: '导入模板数据', category: 'template', dangerous: true },
  [PERMISSIONS.TEMPLATE_VERSION]: { name: '版本控制', description: '查看和回滚模板版本', category: 'template', dangerous: false },
  [PERMISSIONS.TEMPLATE_BATCH]: { name: '批量操作', description: '批量删除/更新模板', category: 'template', dangerous: true },

  // 提示词权限
  [PERMISSIONS.PROMPT_GENERATE]: { name: '生成提示词', description: '使用提示词生成功能', category: 'prompt', dangerous: false },
  [PERMISSIONS.PROMPT_OPTIMIZE]: { name: '优化提示词', description: '使用提示词优化功能', category: 'prompt', dangerous: false },
  [PERMISSIONS.PROMPT_VIDEO_ANALYSIS]: { name: '视频反推', description: '使用视频反推功能', category: 'prompt', dangerous: false },
  [PERMISSIONS.PROMPT_UNLIMITED]: { name: '无限制生成', description: '无次数限制生成提示词', category: 'prompt', dangerous: true },

  // 用户管理权限
  [PERMISSIONS.USER_VIEW]: { name: '查看用户', description: '查看用户列表和详情', category: 'user', dangerous: false },
  [PERMISSIONS.USER_UPDATE]: { name: '更新用户', description: '修改用户信息', category: 'user', dangerous: true },
  [PERMISSIONS.USER_ROLE]: { name: '修改角色', description: '修改用户角色', category: 'user', dangerous: true },
  [PERMISSIONS.USER_BAN]: { name: '封禁用户', description: '封禁/解封用户', category: 'user', dangerous: true },

  // 系统管理权限
  [PERMISSIONS.SYSTEM_AUDIT]: { name: '审计日志', description: '查看系统审计日志', category: 'system', dangerous: false },
  [PERMISSIONS.SYSTEM_CONFIG]: { name: '系统配置', description: '修改系统配置', category: 'system', dangerous: true },
  [PERMISSIONS.SYSTEM_ADMIN]: { name: '管理员权限', description: '完整的管理员权限', category: 'system', dangerous: true },
}
