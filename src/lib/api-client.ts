/**
 * 前端 API 调用工具
 * 统一处理请求头、错误解析和数据提取
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message = json.error?.message || json.error || json.message || '请求失败'
    const code = json.error?.code || `HTTP_${res.status}`
    throw new ApiError(message, code, res.status)
  }

  return json.data as T
}