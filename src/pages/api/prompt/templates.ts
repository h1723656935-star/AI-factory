// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, createServiceClient } from '@/lib/supabase'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { promptTemplateCreateSchema, promptTemplateUpdateSchema } from '@/lib/schemas'
import {
  getAllTemplates, getTemplatesByPlatform, getTemplatesByStyle,
  getTemplatesByPlatformAndStyle, getTemplateCategories, getRandomTemplate,
  createTemplate, updateTemplate, deleteTemplate, importTemplates, exportTemplates,
  resetToDefaults, loadTemplates, getTemplateById,
} from '@/lib/prompt-templates'

const supabase = createAdminClient()
const serviceSupabase = createServiceClient()

// ==================== 辅助函数 ====================

async function getUserId(req: NextApiRequest): Promise<string | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data: { user } } = await supabase.auth.getUser(token)
  return user?.id || null
}

async function writeAuditLog(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, any> = {}
) {
  try {
    await serviceSupabase.rpc('write_audit_log', {
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_ip_address: null,
      p_user_agent: null,
      p_metadata: metadata,
    })
  } catch (e) {
    console.warn('Audit log write failed:', e)
  }
}

async function createVersionSnapshot(
  templateId: string,
  userId: string | null,
  description?: string
) {
  const template = getTemplateById(templateId)
  if (!template) return null

  const content = {
    name: template.name,
    platform: template.platform,
    style: template.style,
    category: template.category,
    prompt: template.prompt || template.template,
    description: template.description,
    aspectRatio: template.aspectRatio,
  }

  try {
    const { data } = await serviceSupabase.rpc('create_template_version', {
      p_template_id: templateId,
      p_content: content,
      p_description: description || null,
      p_created_by: userId,
    })
    return data
  } catch (e) {
    console.warn('Version snapshot failed:', e)
    return null
  }
}

// ==================== 版本控制 API ====================

async function handleGetVersions(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  const templateId = req.query.template_id as string
  if (!templateId) return errorResponse(res, 'template_id is required', 400)

  try {
    const { data, error } = await serviceSupabase
      .from('template_versions')
      .select(`
        id,
        version_number,
        description,
        created_by,
        created_at,
        profiles(name)
      `)
      .eq('template_id', templateId)
      .order('version_number', { ascending: false })

    if (error) throw error

    const versions = (data || []).map(v => ({
      id: v.id,
      versionNumber: v.version_number,
      description: v.description,
      createdBy: v.created_by,
      createdAt: v.created_at,
      creatorName: v.profiles?.name || '未知',
    }))

    return successResponse(res, versions)
  } catch (e) {
    console.error('Get versions error:', e)
    return errorResponse(res, '获取版本历史失败', 500)
  }
}

async function handleCreateVersion(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  const { template_id, description } = req.body
  if (!template_id) return errorResponse(res, 'template_id is required', 400)

  const versionId = await createVersionSnapshot(template_id, userId, description)
  if (!versionId) return errorResponse(res, '创建版本快照失败', 500)

  await writeAuditLog(userId, 'template_version_create', 'template', template_id, { versionId, description })

  return successResponse(res, { id: versionId, message: '版本快照已创建' }, 201)
}

async function handleRollback(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  const { version_id } = req.body
  if (!version_id) return errorResponse(res, 'version_id is required', 400)

  try {
    const { data, error } = await serviceSupabase.rpc('rollback_template_version', {
      p_version_id: version_id,
      p_rollback_by: userId,
    })

    if (error) throw error

    // 获取版本信息用于审计
    const { data: version } = await serviceSupabase
      .from('template_versions')
      .select('template_id, version_number')
      .eq('id', version_id)
      .single()

    await writeAuditLog(userId, 'template_version_rollback', 'template', version?.template_id, {
      versionId: version_id,
      rolledBackToVersion: version?.version_number,
    })

    return successResponse(res, { id: data, message: '回滚成功' })
  } catch (e: any) {
    if (e.message?.includes('版本不存在')) {
      return errorResponse(res, '版本不存在', 404)
    }
    console.error('Rollback error:', e)
    return errorResponse(res, '回滚失败', 500)
  }
}

async function handleVersionDiff(req: NextApiRequest, res: NextApiResponse) {
  const id1 = req.query.id1 as string
  const id2 = req.query.id2 as string
  if (!id1 || !id2) return errorResponse(res, 'id1 and id2 are required', 400)

  try {
    const { data: v1 } = await serviceSupabase
      .from('template_versions')
      .select('content, version_number')
      .eq('id', id1)
      .single()

    const { data: v2 } = await serviceSupabase
      .from('template_versions')
      .select('content, version_number')
      .eq('id', id2)
      .single()

    if (!v1 || !v2) return errorResponse(res, '版本不存在', 404)

    // 简单差异对比
    const diff: any = {}
    const allKeys = [...new Set([...Object.keys(v1.content), ...Object.keys(v2.content)])]

    for (const key of allKeys) {
      if (JSON.stringify(v1.content[key]) !== JSON.stringify(v2.content[key])) {
        diff[key] = { from: v1.content[key], to: v2.content[key] }
      }
    }

    return successResponse(res, {
      version1: v1.version_number,
      version2: v2.version_number,
      diff,
    })
  } catch (e) {
    console.error('Diff error:', e)
    return errorResponse(res, '对比失败', 500)
  }
}

// ==================== 批量操作 API ====================

async function handleBatchDelete(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return errorResponse(res, 'ids array is required', 400)
  }

  const { deleted, failed } = { deleted: 0, failed: [] as string[] }

  for (const id of ids) {
    const ok = deleteTemplate(id)
    if (ok) {
      deleted++
      await writeAuditLog(userId, 'batch_delete', 'template', id, { batchOperation: true })
    } else {
      failed.push(id)
    }
  }

  return successResponse(res, { deleted, failed, total: ids.length })
}

async function handleBatchUpdate(req: NextApiRequest, res: NextApiResponse, userId: string | null) {
  const { ids, data } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return errorResponse(res, 'ids array is required', 400)
  }
  if (!data || Object.keys(data).length === 0) {
    return errorResponse(res, 'data object is required', 400)
  }

  // 允许批量更新的字段
  const allowedFields = ['name', 'platform', 'style', 'category', 'description', 'aspectRatio']
  const updateData: any = {}
  for (const key of allowedFields) {
    if (data[key] !== undefined) updateData[key] = data[key]
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse(res, 'No valid fields to update', 400)
  }

  const { updated, failed } = { updated: 0, failed: [] as string[] }

  for (const id of ids) {
    const tpl = updateTemplate(id, updateData)
    if (tpl) {
      updated++
      await writeAuditLog(userId, 'batch_update', 'template', id, { batchOperation: true, changes: updateData })
    } else {
      failed.push(id)
    }
  }

  return successResponse(res, { updated, failed, total: ids.length })
}

async function handleBatchExport(req: NextApiRequest, res: NextApiResponse) {
  const { ids } = req.body
  let templates

  if (Array.isArray(ids) && ids.length > 0) {
    // 导出指定 ID 的模板
    templates = ids.map((id: string) => getTemplateById(id)).filter(Boolean)
  } else {
    // 导出全部
    templates = getAllTemplates()
  }

  if (!templates || templates.length === 0) {
    return successResponse(res, [])
  }

  const exportData = templates.map(t => ({
    name: t.name,
    platform: t.platform,
    style: t.style,
    category: t.category,
    template: t.prompt || t.template,
    description: t.description,
    aspectRatio: t.aspectRatio,
  }))

  return successResponse(res, exportData)
}

// ==================== 主处理器 ====================

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req
  const userId = await getUserId(req)

  // 确保模板已加载
  loadTemplates()

  // ===== 版本控制 =====
  if (query.action === 'versions' && method === 'GET') {
    return handleGetVersions(req, res, userId)
  }
  if (query.action === 'versions' && method === 'POST') {
    return handleCreateVersion(req, res, userId)
  }
  if (query.action === 'rollback' && method === 'POST') {
    return handleRollback(req, res, userId)
  }
  if (query.action === 'diff' && method === 'GET') {
    return handleVersionDiff(req, res)
  }

  // ===== 批量操作 =====
  if (query.action === 'batch-delete' && method === 'POST') {
    return handleBatchDelete(req, res, userId)
  }
  if (query.action === 'batch-update' && method === 'POST') {
    return handleBatchUpdate(req, res, userId)
  }
  if (query.action === 'batch-export' && method === 'POST') {
    return handleBatchExport(req, res)
  }

  // ===== 导入导出 =====
  if (query.action === 'export') {
    const platform = query.platform as string | undefined
    return successResponse(res, exportTemplates(platform))
  }
  if (query.action === 'import' && method === 'POST') {
    const { templates } = req.body
    if (!Array.isArray(templates)) return errorResponse(res, 'templates must be an array', 400)
    const count = importTemplates(templates)
    await writeAuditLog(userId, 'import', 'template', null, { count, total: getAllTemplates().length })
    return successResponse(res, { imported: count, total: getAllTemplates().length })
  }
  if (query.action === 'reset' && method === 'POST') {
    resetToDefaults()
    await writeAuditLog(userId, 'reset', 'template', null, {})
    return successResponse(res, { total: getAllTemplates().length, message: '已重置为默认模板' })
  }
  if (query.action === 'categories') {
    return successResponse(res, getTemplateCategories())
  }
  if (query.action === 'random') {
    const platform = (query.platform as string) || 'midjourney'
    const style = (query.style as string) || 'cinematic'
    const tpl = getRandomTemplate(platform, style)
    if (!tpl) return errorResponse(res, '没有匹配的模板', 404)
    return successResponse(res, tpl)
  }

  // ===== CRUD =====
  switch (method) {
    case 'GET': {
      const { platform, style, id } = query
      if (id) {
        const tpl = getAllTemplates().find((t) => t.id === id)
        if (!tpl) return errorResponse(res, '模板不存在', 404)
        return successResponse(res, tpl)
      }
      if (platform && style) {
        return successResponse(res, getTemplatesByPlatformAndStyle(platform as string, style as string))
      }
      if (platform) {
        return successResponse(res, getTemplatesByPlatform(platform as string))
      }
      if (style) {
        return successResponse(res, getTemplatesByStyle(style as string))
      }
      return successResponse(res, getAllTemplates())
    }

    case 'POST': {
      const body = validateBody(req, promptTemplateCreateSchema)
      const tpl = createTemplate(body)
      await writeAuditLog(userId, 'create', 'template', tpl?.id, body)
      return successResponse(res, tpl, 201)
    }

    case 'PUT': {
      const { id, ...data } = req.body
      if (!id) return errorResponse(res, 'id is required', 400)
      const valid = promptTemplateUpdateSchema.safeParse(data)
      if (!valid.success) return errorResponse(res, valid.error.errors[0].message, 400)

      // 创建版本快照（更新前）
      await createVersionSnapshot(id, userId, '自动保存更新前版本')

      const tpl = updateTemplate(id, data)
      if (!tpl) return errorResponse(res, '模板不存在', 404)

      await writeAuditLog(userId, 'update', 'template', id, data)
      return successResponse(res, tpl)
    }

    case 'DELETE': {
      const { id } = req.body
      if (!id) return errorResponse(res, 'id is required', 400)
      const ok = deleteTemplate(id)
      if (!ok) return errorResponse(res, '模板不存在', 404)
      await writeAuditLog(userId, 'delete', 'template', id, {})
      return successResponse(res, { deleted: true })
    }

    default:
      return errorResponse(res, 'Method not allowed', 405)
  }
}

export default withErrorHandler(handler)