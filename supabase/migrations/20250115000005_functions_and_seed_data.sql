-- ============================================================
-- Migration 005: 存储过程、工具函数与种子数据
-- 描述: 创建业务查询函数、统计聚合、数据清理函数;
--       插入默认定价方案与系统提示词模板
-- 版本: 1.0.0
-- 日期: 2025-01-15
-- 依赖: 20250115000004_audit_logs_and_security.sql
-- ============================================================

-- ============================================================
-- PART 1: 业务查询函数
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 获取用户使用统计
-- 返回用户今日/本周/总计的使用次数
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id UUID)
RETURNS TABLE (
    analysis_count_today BIGINT,
    analysis_count_week BIGINT,
    analysis_count_total BIGINT,
    script_count_total BIGINT,
    storyboard_count_total BIGINT,
    prompt_count_total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE))::BIGINT,
        COUNT(*)::BIGINT,
        (SELECT COUNT(*)::BIGINT FROM public.scripts WHERE user_id = p_user_id),
        (SELECT COUNT(*)::BIGINT FROM public.storyboards WHERE user_id = p_user_id),
        (SELECT COUNT(*)::BIGINT FROM public.prompts WHERE user_id = p_user_id)
    FROM public.video_analysis
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_usage_stats IS '获取用户使用统计：今日/本周/总计分析次数 + 脚本/分镜/提示词数量';

-- ------------------------------------------------------------
-- 1.2 获取用户当前订阅与配额
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_user_id UUID)
RETURNS TABLE (
    role TEXT,
    plan_name TEXT,
    subscription_status TEXT,
    daily_analysis_limit INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
) AS $$
DECLARE
    v_role TEXT;
    v_limit INTEGER;
BEGIN
    -- 获取角色
    SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = p_user_id;

    -- 根据角色确定每日限制
    v_limit := CASE v_role
        WHEN 'free' THEN 3
        WHEN 'basic' THEN 20
        WHEN 'premium' THEN 999999
        WHEN 'enterprise' THEN 999999
        WHEN 'admin' THEN 999999
        ELSE 3
    END;

    RETURN QUERY
    SELECT
        v_role,
        COALESCE(s.plan_name, '免费版'),
        COALESCE(s.status, 'active'),
        v_limit,
        s.start_date,
        s.end_date
    FROM public.subscriptions s
    WHERE s.user_id = p_user_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_subscription_info IS '获取用户当前订阅方案与每日配额';

-- ------------------------------------------------------------
-- 1.3 检查用户是否可以执行操作（配额检查）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_quota(
    p_user_id UUID,
    p_action_type TEXT
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reason TEXT
) AS $$
DECLARE
    v_role TEXT;
    v_daily_limit INTEGER;
    v_today_count BIGINT;
BEGIN
    -- 获取角色和限制
    SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = p_user_id;

    CASE p_action_type
        WHEN 'analysis' THEN
            v_daily_limit := CASE v_role
                WHEN 'free' THEN 3
                WHEN 'basic' THEN 20
                WHEN 'premium' THEN 999999
                WHEN 'enterprise' THEN 999999
                WHEN 'admin' THEN 999999
                ELSE 3
            END;

            SELECT COUNT(*) INTO v_today_count
            FROM public.video_analysis
            WHERE user_id = p_user_id AND created_at >= CURRENT_DATE;

        ELSE
            -- 其他操作暂时无限制
            v_daily_limit := 999999;
            v_today_count := 0;
    END CASE;

    allowed := v_today_count < v_daily_limit;
    remaining := v_daily_limit - v_today_count::INTEGER;
    reason := CASE
        WHEN NOT allowed THEN '已达到每日 ' || v_daily_limit || ' 次限制'
        ELSE 'ok'
    END;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_user_quota IS '检查用户是否在配额范围内';

-- ------------------------------------------------------------
-- 1.4 获取用户操作时间线
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_timeline(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    event_time TIMESTAMPTZ,
    event_type TEXT,
    event_title TEXT,
    event_description TEXT,
    event_metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        created_at AS event_time,
        action_type AS event_type,
        title AS event_title,
        description AS event_description,
        metadata AS event_metadata
    FROM public.user_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_timeline IS '获取用户操作时间线，按时间倒序';

-- ============================================================
-- PART 2: 数据清理与维护函数
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 清理过期数据
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_data(
    p_retention_days INTEGER DEFAULT 365
)
RETURNS TABLE (
    deleted_audit_logs BIGINT,
    deleted_history BIGINT
) AS $$
BEGIN
    -- 清理超过保留期限的审计日志
    WITH deleted AS (
        DELETE FROM public.audit_logs
        WHERE created_at < (now() - (p_retention_days || ' days')::INTERVAL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_audit_logs FROM deleted;

    -- 清理超过保留期限的用户历史记录
    WITH deleted AS (
        DELETE FROM public.user_history
        WHERE created_at < (now() - (p_retention_days || ' days')::INTERVAL)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_history FROM deleted;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_data IS '清理超过保留期限的审计日志和历史记录';

-- ------------------------------------------------------------
-- 2.2 修复孤立记录（user_id 指向已删除的用户）
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.repair_orphaned_records()
RETURNS TABLE (
    table_name TEXT,
    orphaned_count BIGINT
) AS $$
DECLARE
    v_count BIGINT;
BEGIN
    -- 检查 video_analysis 中的孤儿
    SELECT COUNT(*) INTO v_count
    FROM public.video_analysis va
    WHERE va.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = va.user_id);
    IF v_count > 0 THEN
        UPDATE public.video_analysis SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = video_analysis.user_id);
        table_name := 'video_analysis';
        orphaned_count := v_count;
        RETURN NEXT;
    END IF;

    -- 检查 scripts 中的孤儿
    SELECT COUNT(*) INTO v_count
    FROM public.scripts s
    WHERE s.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.user_id);
    IF v_count > 0 THEN
        UPDATE public.scripts SET user_id = NULL
        WHERE user_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = scripts.user_id);
        table_name := 'scripts';
        orphaned_count := v_count;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.repair_orphaned_records IS '修复孤立记录（user_id 指向已删除的用户）';

-- ============================================================
-- PART 3: 种子数据
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 默认定价方案
-- 使用 ON CONFLICT DO UPDATE 确保幂等
-- ------------------------------------------------------------
INSERT INTO public.pricing_plans
    (id, name, price, original_price, period, description, features, is_active, priority, is_recommended)
VALUES
    (
        'free',
        '免费版',
        0, NULL,
        'month',
        '适合个人创作者体验',
        ARRAY['每日 3 次视频分析', '基础脚本生成', '5 个提示词模板', '7 天历史记录'],
        true, 1, false
    ),
    (
        'basic',
        '基础版',
        29, 59,
        'month',
        '适合刚起步的创作者',
        ARRAY['每日 20 次视频分析', '高级脚本生成', '全部分镜模板', '30 天历史记录', '优先客服支持'],
        true, 2, false
    ),
    (
        'premium',
        '高级版',
        99, 199,
        'month',
        '适合专业内容团队',
        ARRAY['无限视频分析', 'AI 智能脚本优化', '无限分镜生成', '无限历史记录', 'API 接口访问', '专属客户经理'],
        true, 3, true
    ),
    (
        'enterprise',
        '企业版',
        499, 999,
        'month',
        '适合大型内容团队与机构',
        ARRAY['无限视频分析', 'AI 智能脚本优化', '无限分镜生成', '永久历史记录', 'API 接口访问', '专属客户经理', '定制化模型训练', '私有化部署支持'],
        true, 4, false
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    is_recommended = EXCLUDED.is_recommended;

-- ------------------------------------------------------------
-- 3.2 系统预置提示词模板
-- 公开模板，user_id 为 NULL
-- ------------------------------------------------------------
INSERT INTO public.prompt_templates
    (id, user_id, name, platform, prompt, style, aspect_ratio, is_public)
VALUES
    (
        uuid_generate_v4(),
        NULL,
        '电影级人像',
        'midjourney',
        'cinematic portrait of {subject}, dramatic lighting, 8k resolution, shot on ARRI Alexa, shallow depth of field, professional color grading',
        'cinematic',
        '9:16',
        true
    ),
    (
        uuid_generate_v4(),
        NULL,
        '赛博朋克风格',
        'midjourney',
        'cyberpunk aesthetic {subject}, neon lights, rain-slicked streets, holographic displays, blade runner atmosphere, cinematic composition, 8k',
        'cyberpunk',
        '16:9',
        true
    ),
    (
        uuid_generate_v4(),
        NULL,
        '动漫角色',
        'stable-diffusion',
        'anime style {subject}, studio ghibli inspired, vibrant colors, detailed background, soft lighting, cel-shaded, masterpiece quality',
        'anime',
        '1:1',
        true
    ),
    (
        uuid_generate_v4(),
        NULL,
        '产品摄影',
        'dalle',
        'professional product photography of {subject}, studio lighting, white background, clean composition, commercial photography, 4k detail',
        'realistic',
        '1:1',
        true
    ),
    (
        uuid_generate_v4(),
        NULL,
        '极简设计',
        'midjourney',
        'minimalist design of {subject}, clean lines, negative space, geometric shapes, pastel colors, modern aesthetic, vector art style',
        'minimal',
        '9:16',
        true
    ),
    (
        uuid_generate_v4(),
        NULL,
        '复古胶片',
        'stable-diffusion',
        'vintage film photography {subject}, 35mm film grain, retro aesthetic, warm tones, analog camera, light leaks, nostalgic mood',
        'vintage',
        '4:3',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 迁移 005 完成
-- ============================================================