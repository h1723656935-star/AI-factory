import { z } from 'zod'
import { validateBody } from '@/lib/api'
import { videoAnalysisSchema } from '@/lib/schemas'

function createReq(body: unknown): any {
  return { method: 'POST', headers: {}, body, url: '/api/analysis/video', socket: { remoteAddress: '127.0.0.1' } }
}

describe('API integration: /api/analysis/video validation', () => {
  it('accepts valid input and returns parsed body', () => {
    const req = createReq({ url: 'https://www.douyin.com/video/abc', platform: 'douyin' })
    const data = validateBody(req, videoAnalysisSchema)
    expect(data.url).toContain('douyin')
    expect(data.platform).toBe('douyin')
  })

  it('throws ValidationFailedError on bad input', () => {
    const req = createReq({ url: 'not-a-url' })
    expect(() => validateBody(req, videoAnalysisSchema)).toThrow(/请输入有效的视频链接/)
  })
})

describe('API integration: nested schemas', () => {
  const schema = z.object({
    user: z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    }),
  })

  it('returns nested data when valid', () => {
    const req = createReq({ user: { name: 'Alice', age: 30 } })
    const data = validateBody(req, schema)
    expect(data.user.name).toBe('Alice')
  })

  it('collects multiple error paths', () => {
    const req = createReq({ user: { name: '', age: -1 } })
    try {
      validateBody(req, schema)
      fail('should have thrown')
    } catch (err: any) {
      expect(err.message).toContain('user.name')
      expect(err.message).toContain('user.age')
    }
  })
})
