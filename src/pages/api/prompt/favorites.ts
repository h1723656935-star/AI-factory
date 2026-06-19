// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { favoriteCreateSchema } from '@/lib/schemas'

const supabase = createAdminClient()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (!supabase) {
    // 内存存储 fallback
    const store = (globalThis as any).__promptFavorites || []
    ;(globalThis as any).__promptFavorites = store

    const id = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2)

    switch (method) {
      case 'GET': {
        const { category, search } = req.query
        let items = store
        if (category && category !== 'all') items = items.filter((f: any) => f.category === category)
        if (search) items = items.filter((f: any) => f.prompt.toLowerCase().includes(String(search).toLowerCase()))
        return successResponse(res, items)
      }
      case 'POST': {
        const body = validateBody(req, favoriteCreateSchema)
        const item = { id: id(), ...body, created_at: new Date().toISOString() }
        store.unshift(item)
        return successResponse(res, item)
      }
      default:
        return errorResponse(res, 'Method not allowed', 405)
    }
  }

  switch (method) {
    case 'GET': {
      const { category, search } = req.query
      let query = supabase.from('favorites').select('*').order('created_at', { ascending: false })
      if (category && category !== 'all') query = query.eq('category', category)
      if (search) query = query.ilike('prompt', `%${search}%`)
      const { data, error } = await query
      if (error) return errorResponse(res, error.message, 500)
      return successResponse(res, data)
    }
    case 'POST': {
      const body = validateBody(req, favoriteCreateSchema)
      const { data, error } = await supabase.from('favorites').insert(body).select().single()
      if (error) return errorResponse(res, error.message, 500)
      return successResponse(res, data)
    }
    default:
      return errorResponse(res, 'Method not allowed', 405)
  }
}

export default withErrorHandler(handler)