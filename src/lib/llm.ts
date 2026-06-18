/**
 * 通用 LLM 服务封装
 * 支持 OpenAI 兼容接口、Anthropic、智谱、通义千问、DeepSeek
 * 统一返回字符串或 JSON 对象
 */

import { fetch as undiciFetch, ProxyAgent } from 'undici'

export type LlmProvider = 'openai' | 'anthropic' | 'zhipu' | 'dashscope' | 'deepseek'

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmOptions {
  provider?: LlmProvider
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
}

interface ProviderConfig {
  apiKey: string | undefined
  baseUrl: string
  model: string
  headers: Record<string, string>
  formatBody: (messages: LlmMessage[], options: LlmOptions) => unknown
  parseResponse: (res: Response) => Promise<string>
}

function detectProvider(): LlmProvider {
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.ZHIPU_API_KEY) return 'zhipu'
  if (process.env.DASHSCOPE_API_KEY) return 'dashscope'
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek'
  return 'openai'
}

function getProviderConfig(provider: LlmProvider): ProviderConfig {
  switch (provider) {
    case 'openai':
    default:
      return {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        headers: { 'Content-Type': 'application/json' },
        formatBody: (messages, options) => ({
          model: options.model || getProviderConfig('openai').model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }),
        parseResponse: async (res) => {
          const data = await res.json()
          return data.choices?.[0]?.message?.content || ''
        },
      }

    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        formatBody: (messages, options) => {
          const system = messages.find((m) => m.role === 'system')?.content
          const conversation = messages.filter((m) => m.role !== 'system')
          return {
            model: options.model || getProviderConfig('anthropic').model,
            system,
            messages: conversation,
            max_tokens: options.maxTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
          }
        },
        parseResponse: async (res) => {
          const data = await res.json()
          return data.content?.[0]?.text || ''
        },
      }

    case 'zhipu':
      return {
        apiKey: process.env.ZHIPU_API_KEY,
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: process.env.ZHIPU_MODEL || 'glm-4-flash',
        headers: { 'Content-Type': 'application/json' },
        formatBody: (messages, options) => ({
          model: options.model || getProviderConfig('zhipu').model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
        parseResponse: async (res) => {
          const data = await res.json()
          return data.choices?.[0]?.message?.content || ''
        },
      }

    case 'dashscope':
      return {
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: process.env.DASHSCOPE_MODEL || 'qwen-turbo',
        headers: { 'Content-Type': 'application/json' },
        formatBody: (messages, options) => ({
          model: options.model || getProviderConfig('dashscope').model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
        parseResponse: async (res) => {
          const data = await res.json()
          return data.choices?.[0]?.message?.content || ''
        },
      }

    case 'deepseek':
      return {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        headers: { 'Content-Type': 'application/json' },
        formatBody: (messages, options) => ({
          model: options.model || getProviderConfig('deepseek').model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }),
        parseResponse: async (res) => {
          const data = await res.json()
          return data.choices?.[0]?.message?.content || ''
        },
      }
  }
}

export async function chatCompletion(
  messages: LlmMessage[],
  options: LlmOptions = {}
): Promise<string> {
  const provider = options.provider || detectProvider()
  const config = getProviderConfig(provider)

  if (!config.apiKey) {
    throw new Error(`未配置 ${provider} 的 API Key`)
  }

  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined

  const res = await undiciFetch(`${config.baseUrl}/chat/completions`, {
    dispatcher: dispatcher as never,
    method: 'POST',
    headers: {
      ...config.headers,
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(config.formatBody(messages, options)),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`LLM API 错误 (${provider}): ${res.status} ${text}`)
  }

  return config.parseResponse(res)
}

export async function chatCompletionJson<T = unknown>(
  messages: LlmMessage[],
  options: LlmOptions = {}
): Promise<T> {
  const text = await chatCompletion(messages, { ...options, responseFormat: 'json' })

  try {
    // 尝试提取 JSON 代码块内容
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    const jsonText = jsonMatch ? jsonMatch[1].trim() : text.trim()
    return JSON.parse(jsonText) as T
  } catch {
    throw new Error(`LLM 返回内容不是有效 JSON: ${text.slice(0, 200)}`)
  }
}

/**
 * 检查是否配置了任意 LLM
 */
export function isLlmConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.ZHIPU_API_KEY ||
      process.env.DASHSCOPE_API_KEY ||
      process.env.DEEPSEEK_API_KEY
  )
}
