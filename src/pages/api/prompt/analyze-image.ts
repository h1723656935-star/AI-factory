// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { chatCompletionJson, isLlmConfigured } from '@/lib/llm'
import { validateBody, withErrorHandler, errorResponse, successResponse } from '@/lib/api'
import { applyRateLimit } from '@/lib/rate-limit'
import { imageAnalysisSchema } from '@/lib/schemas'
import type { ImageAnalysis } from '@/types'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  if (!applyRateLimit(req, res, 'ai')) return

  const { imageBase64, model, language } = validateBody(req, imageAnalysisSchema)

  if (!isLlmConfigured()) {
    return errorResponse(res, '请先配置 AI 模型 API Key', 500)
  }

  const isEnglish = language === 'en'

  const systemPrompt = isEnglish
    ? 'You are a professional AI image analyst. Analyze the uploaded image and output structured JSON describing the subject, composition, camera angle, artistic style, color palette, and lighting. Be specific and detailed. Output ONLY valid JSON.'
    : '你是一位专业的 AI 图像分析师。分析上传的图片，输出结构化 JSON，描述主体、构图、镜头角度、艺术风格、色彩和光影。要具体详细。只输出有效 JSON。'

  const userPrompt = isEnglish
    ? `Analyze this image in detail and output JSON with these fields:
{
  "subject": "Detailed description of the main subject(s)",
  "composition": "Composition type, framing, depth of field",
  "camera": "Camera angle and shot type (close-up, portrait, wide, aerial, etc.)",
  "style": "Artistic style and genre",
  "colors": "Color palette, dominant colors, saturation, temperature",
  "lighting": "Lighting type, direction, atmosphere",
  "tags": ["tag1", "tag2", "tag3"]
}

Output ONLY valid JSON, no markdown, no explanations.`
    : `详细分析这张图片，输出以下 JSON：
{
  "subject": "主体详细描述",
  "composition": "构图类型、取景、景深",
  "camera": "镜头角度和类型（特写、半身、广角、航拍等）",
  "style": "艺术风格和流派",
  "colors": "色彩方案、主色调、饱和度、冷暖",
  "lighting": "光线类型、方向、氛围",
  "tags": ["标签1", "标签2", "标签3"]
}

只输出有效 JSON，不要 markdown，不要解释。`

  try {
    const analysis = await chatCompletionJson<ImageAnalysis>(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        } as never,
      ],
      { temperature: 0.3, maxTokens: 1024, model: model || undefined, language: language || undefined }
    )

    return successResponse(res, analysis)
  } catch (err) {
    return errorResponse(res, '图片分析失败，请确保使用的模型支持视觉功能（如 GLM-4V、GPT-4o 等）', 500)
  }
}

export default withErrorHandler(handler)