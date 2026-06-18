import { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { errorResponse, successResponse } from '@/lib/api'

const fallbackPlans = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    original_price: null,
    period: 'month',
    description: '适合个人创作者体验',
    features: ['每日 3 次视频分析', '基础脚本生成', '5 个提示词模板', '7 天历史记录'],
    is_active: true,
    priority: 1,
    is_recommended: false,
  },
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    original_price: 59,
    period: 'month',
    description: '适合刚起步的创作者',
    features: ['每日 20 次视频分析', '高级脚本生成', '全部分镜模板', '30 天历史记录', '优先客服支持'],
    is_active: true,
    priority: 2,
    is_recommended: false,
  },
  {
    id: 'premium',
    name: '高级版',
    price: 99,
    original_price: 199,
    period: 'month',
    description: '适合专业内容团队',
    features: ['无限视频分析', 'AI 智能脚本优化', '无限分镜生成', '无限历史记录', 'API 接口访问', '专属客户经理'],
    is_active: true,
    priority: 3,
    is_recommended: true,
  },
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405)
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return successResponse(res, fallbackPlans)
  }

  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error) {
      return errorResponse(res, error.message, 500)
    }

    return successResponse(res, data.length > 0 ? data : fallbackPlans)
  } catch {
    return successResponse(res, fallbackPlans)
  }
}
