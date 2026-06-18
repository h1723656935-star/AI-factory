/**
 * OpenAPI 文档查看接口
 * GET /api/docs - 返回 Swagger UI 的 JSON 描述
 */
import { NextApiRequest, NextApiResponse } from 'next'
import { successResponse, withApiHandler } from '@/lib/api'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
  return successResponse(res, {
    title: '爆款工厂AI API',
    version: '1.0.0',
    specUrl: '/openapi.yaml',
    swaggerUiUrl: 'https://editor.swagger.io/?url=https://baokuan.ai/openapi.yaml',
  })
}

export default withApiHandler(handler)
