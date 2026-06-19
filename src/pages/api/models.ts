import { NextApiRequest, NextApiResponse } from 'next'
import { getAvailableModels, isLlmConfigured } from '@/lib/llm'
import { successResponse, withErrorHandler } from '@/lib/api'

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const configured = isLlmConfigured()
  const models = configured ? getAvailableModels() : []

  return successResponse(res, {
    configured,
    models,
    defaultProvider: process.env.ZHIPU_API_KEY
      ? 'zhipu'
      : process.env.OPENAI_API_KEY
        ? 'openai'
        : process.env.DEEPSEEK_API_KEY
          ? 'deepseek'
          : process.env.DASHSCOPE_API_KEY
            ? 'dashscope'
            : process.env.ANTHROPIC_API_KEY
              ? 'anthropic'
              : null,
    defaultModel: process.env.ZHIPU_MODEL || 'glm-4-flash',
  })
}

export default withErrorHandler(handler)