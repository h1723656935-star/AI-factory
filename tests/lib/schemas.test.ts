import {
  videoAnalysisSchema,
  scriptGenerateSchema,
  storyboardGenerateSchema,
  promptGenerateSchema,
  promptTemplateSchema,
} from '@/lib/schemas'

describe('zod schemas', () => {
  describe('videoAnalysisSchema', () => {
    it('accepts a valid URL with platform', () => {
      const r = videoAnalysisSchema.safeParse({ url: 'https://www.douyin.com/video/1', platform: 'douyin' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.platform).toBe('douyin')
    })

    it('rejects invalid URLs', () => {
      const r = videoAnalysisSchema.safeParse({ url: 'not-a-url' })
      expect(r.success).toBe(false)
    })

    it('defaults platform to unknown', () => {
      const r = videoAnalysisSchema.safeParse({ url: 'https://x.com' })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.platform).toBe('unknown')
    })
  })

  describe('scriptGenerateSchema', () => {
    it('requires topic with at least 2 chars', () => {
      expect(scriptGenerateSchema.safeParse({ topic: 'a' }).success).toBe(false)
      expect(scriptGenerateSchema.safeParse({ topic: '短视频脚本' }).success).toBe(true)
    })
  })

  describe('storyboardGenerateSchema', () => {
    it('clamps frameCount between 3 and 12', () => {
      const low = storyboardGenerateSchema.safeParse({ scriptContent: 'long enough content here', frameCount: 2 })
      expect(low.success).toBe(false)
      const high = storyboardGenerateSchema.safeParse({ scriptContent: 'long enough content here', frameCount: 13 })
      expect(high.success).toBe(false)
    })
  })

  describe('promptGenerateSchema', () => {
    it('rejects empty subject', () => {
      expect(promptGenerateSchema.safeParse({ subject: '' }).success).toBe(false)
    })
  })

  describe('promptTemplateSchema', () => {
    it('requires non-empty name and prompt', () => {
      expect(promptTemplateSchema.safeParse({ name: '', prompt: 'short' }).success).toBe(false)
      expect(promptTemplateSchema.safeParse({ name: 'tpl', prompt: 'cinematic' }).success).toBe(true)
    })
  })
})
