/**
 * 通用 LLM 服务封装
 * 支持 OpenAI 兼容接口、Anthropic、智谱、通义千问、DeepSeek
 * 统一返回字符串或 JSON 对象
 */

import { fetch as undiciFetch, ProxyAgent } from 'undici'
import { globalCache, cacheAside } from './cache'

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
  language?: 'cn' | 'en'
}

/** 可用模型列表 */
export const AVAILABLE_MODELS: Record<LlmProvider, Array<{ value: string; label: string; free: boolean }>> = {
  zhipu: [
    { value: 'glm-4-flash', label: 'GLM-4-Flash（免费）', free: true },
    { value: 'glm-4-air', label: 'GLM-4-Air', free: false },
    { value: 'glm-4', label: 'GLM-4', free: false },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', free: false },
    { value: 'gpt-4o', label: 'GPT-4o', free: false },
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek-V3', free: false },
    { value: 'deepseek-reasoner', label: 'DeepSeek-R1', free: false },
  ],
  dashscope: [
    { value: 'qwen-turbo', label: 'Qwen-Turbo', free: false },
    { value: 'qwen-plus', label: 'Qwen-Plus', free: false },
    { value: 'qwen-max', label: 'Qwen-Max', free: false },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', free: false },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', free: false },
  ],
}

/** 当前可用模型列表（仅已配置的提供商） */
export function getAvailableModels(): Array<{ provider: LlmProvider; providerLabel: string; models: Array<{ value: string; label: string; free: boolean }> }> {
  const providers: Array<{ provider: LlmProvider; providerLabel: string }> = []
  if (process.env.ZHIPU_API_KEY) providers.push({ provider: 'zhipu', providerLabel: '智谱AI' })
  if (process.env.OPENAI_API_KEY) providers.push({ provider: 'openai', providerLabel: 'OpenAI' })
  if (process.env.DEEPSEEK_API_KEY) providers.push({ provider: 'deepseek', providerLabel: 'DeepSeek' })
  if (process.env.DASHSCOPE_API_KEY) providers.push({ provider: 'dashscope', providerLabel: '通义千问' })
  if (process.env.ANTHROPIC_API_KEY) providers.push({ provider: 'anthropic', providerLabel: 'Anthropic' })
  return providers.map(p => ({ ...p, models: AVAILABLE_MODELS[p.provider] }))
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
  const configs: Record<LlmProvider, Omit<ProviderConfig, 'formatBody'> & { defaultModel: string }> = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      headers: { 'Content-Type': 'application/json' },
      parseResponse: async (res) => {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ''
      },
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: 'https://api.anthropic.com',
      defaultModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      parseResponse: async (res) => {
        const data = await res.json()
        return data.content?.[0]?.text || ''
      },
    },
    zhipu: {
      apiKey: process.env.ZHIPU_API_KEY,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      defaultModel: process.env.ZHIPU_MODEL || 'glm-4-flash',
      headers: { 'Content-Type': 'application/json' },
      parseResponse: async (res) => {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ''
      },
    },
    dashscope: {
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      defaultModel: process.env.DASHSCOPE_MODEL || 'qwen-turbo',
      headers: { 'Content-Type': 'application/json' },
      parseResponse: async (res) => {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ''
      },
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com',
      defaultModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      headers: { 'Content-Type': 'application/json' },
      parseResponse: async (res) => {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || ''
      },
    },
  }

  const cfg = configs[provider] || configs.openai

  switch (provider) {
    case 'openai':
    default:
      return {
        ...cfg,
        model: cfg.defaultModel,
        formatBody: (messages, options) => ({
          model: options.model || cfg.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }),
      }

    case 'anthropic':
      return {
        ...cfg,
        model: cfg.defaultModel,
        formatBody: (messages, options) => {
          const system = messages.find((m) => m.role === 'system')?.content
          const conversation = messages.filter((m) => m.role !== 'system')
          return {
            model: options.model || cfg.defaultModel,
            system,
            messages: conversation,
            max_tokens: options.maxTokens ?? 2048,
            temperature: options.temperature ?? 0.7,
          }
        },
      }

    case 'zhipu':
      return {
        ...cfg,
        model: cfg.defaultModel,
        formatBody: (messages, options) => ({
          model: options.model || cfg.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
      }

    case 'dashscope':
      return {
        ...cfg,
        model: cfg.defaultModel,
        formatBody: (messages, options) => ({
          model: options.model || cfg.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
      }

    case 'deepseek':
      return {
        ...cfg,
        model: cfg.defaultModel,
        formatBody: (messages, options) => ({
          model: options.model || cfg.defaultModel,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format: options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }),
      }
  }
}

function generateCacheKey(messages: LlmMessage[], options: LlmOptions): string {
  const keyParts = [
    options.provider || 'default',
    options.model || 'default',
    options.temperature?.toString() || '0.7',
    options.responseFormat || 'text',
    JSON.stringify(messages),
  ]
  const hash = keyParts.join('|')
  return `llm:${Buffer.from(hash).toString('base64').slice(0, 64)}`
}

async function executeChatCompletion(
  messages: LlmMessage[],
  options: LlmOptions
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

    if (
      provider === 'zhipu' &&
      res.status === 429 &&
      options.model !== 'glm-4-flash'
    ) {
      console.warn(`智谱模型 ${config.model} 触发 429，自动降级到 glm-4-flash`)
      return chatCompletion(messages, { ...options, model: 'glm-4-flash' })
    }

    throw new Error(`LLM API 错误 (${provider}): ${res.status} ${text}`)
  }

  return config.parseResponse(res as unknown as Response)
}

export async function chatCompletion(
  messages: LlmMessage[],
  options: LlmOptions = {}
): Promise<string> {
  const useCache = options.temperature === 0 || (options.temperature && options.temperature < 0.3)
  
  if (useCache) {
    const cacheKey = generateCacheKey(messages, options)
    return cacheAside(globalCache, cacheKey, 5 * 60 * 1000, () => executeChatCompletion(messages, options))
  }
  
  return executeChatCompletion(messages, options)
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
