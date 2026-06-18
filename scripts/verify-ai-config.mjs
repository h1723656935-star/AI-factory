#!/usr/bin/env node
/**
 * 验证本地 AI 配置脚本
 * 读取 .env.local 中的代理和密钥配置，逐个测试 AI 供应商是否可用
 *
 * 使用方法:
 *   node scripts/verify-ai-config.mjs
 * 或:
 *   npm run verify:ai
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '..', '.env.local')

/**
 * 简易解析 .env.local 文件
 */
function loadEnv(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  未找到 ${filePath}，将使用当前环境变量`)
    return env
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    env[key] = value
  }
  return env
}

const env = loadEnv(envPath)
const proxyUrl = env.HTTPS_PROXY || env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined

console.log('===============================================')
console.log('  爆款工厂AI - 本地 AI 配置验证')
console.log('===============================================')
console.log(`代理配置: ${proxyUrl || '未配置'}`)
console.log('')

const providers = [
  {
    name: 'OpenAI',
    key: env.OPENAI_API_KEY,
    url: `${env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
    model: env.OPENAI_MODEL || 'gpt-4o-mini',
    headers: { 'Content-Type': 'application/json' },
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5,
      temperature: 0,
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '',
  },
  {
    name: 'Anthropic',
    key: env.ANTHROPIC_API_KEY,
    url: 'https://api.anthropic.com/v1/messages',
    model: env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5,
      temperature: 0,
    }),
    parse: (data) => data.content?.[0]?.text || '',
  },
  {
    name: '智谱 AI',
    key: env.ZHIPU_API_KEY,
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: env.ZHIPU_MODEL || 'glm-4-flash',
    headers: { 'Content-Type': 'application/json' },
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 5,
      temperature: 0,
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '',
  },
  {
    name: '通义千问',
    key: env.DASHSCOPE_API_KEY,
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: env.DASHSCOPE_MODEL || 'qwen-turbo',
    headers: { 'Content-Type': 'application/json' },
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 5,
      temperature: 0,
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '',
  },
  {
    name: 'DeepSeek',
    key: env.DEEPSEEK_API_KEY,
    url: 'https://api.deepseek.com/chat/completions',
    model: env.DEEPSEEK_MODEL || 'deepseek-chat',
    headers: { 'Content-Type': 'application/json' },
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 5,
      temperature: 0,
    }),
    parse: (data) => data.choices?.[0]?.message?.content || '',
  },
]

async function testProvider(provider) {
  if (!provider.key) {
    console.log(`⏭️  ${provider.name}: 未配置 API Key`)
    return
  }

  try {
    const response = await undiciFetch(provider.url, {
      method: 'POST',
      dispatcher: dispatcher,
      headers: {
        ...provider.headers,
        Authorization: `Bearer ${provider.key}`,
      },
      body: JSON.stringify(provider.body(provider.model)),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data)
      if (response.status === 429) {
        console.log(`⚠️  ${provider.name}: 429 额度不足 - ${errorMsg.slice(0, 80)}`)
      } else {
        console.log(`❌ ${provider.name}: HTTP ${response.status} - ${errorMsg.slice(0, 80)}`)
      }
      return
    }

    const content = provider.parse(data)
    console.log(`✅ ${provider.name}: 可用 (模型: ${provider.model}, 返回: "${content.slice(0, 30)}")`)
  } catch (error) {
    console.log(`❌ ${provider.name}: 请求失败 - ${error.message}`)
  }
}

;(async () => {
  for (const provider of providers) {
    await testProvider(provider)
  }

  console.log('')
  console.log('===============================================')
  console.log('  验证完成')
  console.log('===============================================')
})()
