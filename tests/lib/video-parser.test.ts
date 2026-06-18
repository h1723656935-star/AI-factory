import { detectPlatform } from '@/lib/video-parser'

// 直接测试内部平台检测函数（同步、可预测）
describe('detectPlatform', () => {
  const cases: Array<[string, string]> = [
    ['https://www.youtube.com/watch?v=abc', 'youtube'],
    ['https://youtu.be/abc', 'youtube'],
    ['https://www.douyin.com/video/123', 'douyin'],
    ['https://v.douyin.com/abc/', 'douyin'],
    ['https://www.bilibili.com/video/BV1abc', 'bilibili'],
    ['https://b23.tv/abc', 'bilibili'],
    ['https://www.kuaishou.com/short-video/3x', 'kuaishou'],
    ['https://www.xiaohongshu.com/explore/abc', 'xiaohongshu'],
    ['https://www.xhs.com/discovery/item/abc', 'xiaohongshu'],
    ['https://example.com/foo', 'unknown'],
  ]

  it.each(cases)('detects %s as %s', (url, expected) => {
    expect(detectPlatform(url)).toBe(expected)
  })
})
