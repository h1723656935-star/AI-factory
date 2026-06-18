-- ============================================================
-- Migration 001: 核心表结构定义
-- 描述: 创建应用核心业务表，包括用户资料、视频分析、脚本、
--       分镜、提示词、历史记录、定价方案、订阅记录
-- 版本: 1.0.0
-- 日期: 2025-01-15
-- 兼容: Supabase CLI >= 1.0.0 | PostgreSQL >= 15
-- ============================================================

-- ------------------------------------------------------------
-- 扩展声明
-- 所有扩展在迁移开头统一声明，确保幂等
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. 用户资料表 (profiles)
-- 与 auth.users 一对一关联，通过触发器自动创建
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles
(
    -- 主键直接引用 auth.users 的 id，确保数据一致性
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- 用户邮箱，从 auth.users 同步
    email TEXT NOT NULL,
    -- 显示名称，默认使用邮箱前缀
    name TEXT,
    -- 头像 URL
    avatar_url TEXT,
    -- 角色：free=免费用户 / basic=基础会员 / premium=高级会员 / enterprise=企业版 / admin=管理员
    role TEXT NOT NULL DEFAULT 'free'
        CHECK (role IN ('free', 'basic', 'premium', 'enterprise', 'admin')),
    -- 用户偏好设置（JSON 灵活扩展）
    -- 结构: { theme, notifications, language, ... }
    preferences JSONB NOT NULL DEFAULT '{
        "theme": "dark",
        "notifications": true,
        "language": "zh-CN"
    }'::jsonb,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '用户资料表，与 auth.users 一一对应';
COMMENT ON COLUMN public.profiles.id IS '关联 auth.users(id)';
COMMENT ON COLUMN public.profiles.role IS '用户角色：free | basic | premium | enterprise | admin';
COMMENT ON COLUMN public.profiles.preferences IS 'JSON 偏好：{theme, notifications, language}';

-- ------------------------------------------------------------
-- 2. 视频分析结果表 (video_analysis)
-- 存储用户提交的视频链接分析结果
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_analysis
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 关联用户（可为 NULL，支持匿名分析）
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 视频链接
    video_url TEXT NOT NULL,
    -- 平台标识
    platform TEXT NOT NULL DEFAULT 'unknown'
        CHECK (platform IN ('douyin', 'kuaishou', 'xiaohongshu', 'bilibili', 'youtube', 'unknown')),
    -- 处理状态
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'complete', 'error')),
    -- 标题分析: { mainTitle, subTitle, keywords, sentiment }
    title_analysis JSONB,
    -- 情绪钩子: [{ type, strength, content }]
    emotional_hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 冲突点: [{ timestamp, description, intensity }]
    conflict_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 反转点: [{ timestamp, content, impact }]
    reversal_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 原始视频元数据
    raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- 错误信息（仅 status=error 时有值）
    error_message TEXT,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.video_analysis IS '爆款视频分析结果';
COMMENT ON COLUMN public.video_analysis.platform IS 'douyin|kuaishou|xiaohongshu|bilibili|youtube|unknown';
COMMENT ON COLUMN public.video_analysis.status IS 'pending|processing|complete|error';
COMMENT ON COLUMN public.video_analysis.title_analysis IS '{mainTitle, subTitle, keywords[], sentiment}';
COMMENT ON COLUMN public.video_analysis.emotional_hooks IS '[{type, strength, content}]';
COMMENT ON COLUMN public.video_analysis.conflict_points IS '[{timestamp, description, intensity}]';
COMMENT ON COLUMN public.video_analysis.reversal_points IS '[{timestamp, content, impact}]';

-- ------------------------------------------------------------
-- 3. AI 脚本表 (scripts)
-- 存储用户生成的短视频脚本
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scripts
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 所有者
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 关联的视频分析（可选）
    analysis_id UUID REFERENCES public.video_analysis(id) ON DELETE SET NULL,
    -- 脚本正文
    content TEXT NOT NULL,
    -- 风格: funny=搞笑 / emotional=情感 / knowledge=知识 / suspense=悬疑 / inspirational=励志 / review=测评
    style TEXT NOT NULL
        CHECK (style IN ('funny', 'emotional', 'knowledge', 'suspense', 'inspirational', 'review')),
    -- 语气
    tone TEXT,
    -- 长度: short=短(<30s) / medium=中(30-60s) / long=长(>60s)
    length TEXT NOT NULL DEFAULT 'medium'
        CHECK (length IN ('short', 'medium', 'long')),
    -- 场景数量
    scene_count INTEGER DEFAULT 4,
    -- 预估时长（如 "约45秒"）
    estimated_duration TEXT,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.scripts IS 'AI 生成的短视频脚本';
COMMENT ON COLUMN public.scripts.style IS 'funny|emotional|knowledge|suspense|inspirational|review';
COMMENT ON COLUMN public.scripts.length IS 'short|medium|long';

-- ------------------------------------------------------------
-- 4. 分镜表 (storyboards)
-- 存储脚本对应的分镜设计
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.storyboards
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 所有者
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 关联脚本
    script_id UUID REFERENCES public.scripts(id) ON DELETE CASCADE,
    -- 分镜帧数组: [{ id, sceneNumber, description, visualPrompt, duration }]
    frames JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 视觉风格: cinematic|anime|realistic|minimal|vintage|cyberpunk
    style TEXT
        CHECK (style IN ('cinematic', 'anime', 'realistic', 'minimal', 'vintage', 'cyberpunk')),
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.storyboards IS '脚本对应的分镜设计';
COMMENT ON COLUMN public.storyboards.frames IS '[{id, sceneNumber, description, visualPrompt, duration}]';
COMMENT ON COLUMN public.storyboards.style IS 'cinematic|anime|realistic|minimal|vintage|cyberpunk';

-- ------------------------------------------------------------
-- 5. AI 提示词表 (prompts)
-- 存储用户生成的 AI 图像提示词
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompts
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 所有者
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 目标平台: midjourney|stable-diffusion|dalle|leonardo|flux|jimeng|keling
    platform TEXT NOT NULL
        CHECK (platform IN (
            'midjourney', 'stable-diffusion', 'dalle',
            'leonardo', 'flux', 'jimeng', 'keling'
        )),
    -- 主体描述
    subject TEXT NOT NULL,
    -- 视觉风格
    style TEXT
        CHECK (style IN ('cinematic', 'anime', 'realistic', 'minimal', 'cyberpunk', 'vintage')),
    -- 细节补充
    details TEXT,
    -- 负面提示词
    negative_prompt TEXT,
    -- 生成的完整提示词
    generated_prompt TEXT NOT NULL,
    -- 宽高比: 16:9|9:16|1:1|4:3
    aspect_ratio TEXT
        CHECK (aspect_ratio IN ('16:9', '9:16', '1:1', '4:3')),
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prompts IS 'AI 图像生成提示词';
COMMENT ON COLUMN public.prompts.platform IS 'midjourney|stable-diffusion|dalle|leonardo|flux|jimeng|keling';
COMMENT ON COLUMN public.prompts.aspect_ratio IS '16:9|9:16|1:1|4:3';

-- ------------------------------------------------------------
-- 6. 提示词模板表 (prompt_templates)
-- 用户自定义和系统预设的提示词模板
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_templates
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 所有者（NULL 表示系统模板）
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 模板名称
    name TEXT NOT NULL,
    -- 适用平台
    platform TEXT NOT NULL DEFAULT 'midjourney'
        CHECK (platform IN (
            'midjourney', 'stable-diffusion', 'dalle',
            'leonardo', 'flux', 'jimeng', 'keling'
        )),
    -- 模板内容
    prompt TEXT NOT NULL,
    -- 视觉风格标签
    style TEXT,
    -- 宽高比
    aspect_ratio TEXT,
    -- 是否公开
    is_public BOOLEAN NOT NULL DEFAULT false,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prompt_templates IS '用户自定义与系统提示词模板';
COMMENT ON COLUMN public.prompt_templates.user_id IS 'NULL 表示系统模板';

-- ------------------------------------------------------------
-- 7. 用户历史记录表 (user_history)
-- 记录用户所有操作行为
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_history
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 所有者
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 操作类型
    action_type TEXT NOT NULL
        CHECK (action_type IN (
            'analysis', 'script', 'storyboard', 'prompt',
            'subscription', 'login', 'other'
        )),
    -- 标题
    title TEXT NOT NULL,
    -- 描述
    description TEXT,
    -- 扩展元数据
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_history IS '用户操作历史记录';
COMMENT ON COLUMN public.user_history.action_type IS 'analysis|script|storyboard|prompt|subscription|login|other';

-- ------------------------------------------------------------
-- 8. 定价方案表 (pricing_plans)
-- 会员订阅定价方案配置
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_plans
(
    -- 方案 ID: free|basic|premium|enterprise
    id TEXT PRIMARY KEY,
    -- 方案名称
    name TEXT NOT NULL,
    -- 当前价格（分为单位，0=免费）
    price INTEGER NOT NULL DEFAULT 0,
    -- 原价（用于展示折扣）
    original_price INTEGER,
    -- 计费周期: month|year|lifetime
    period TEXT NOT NULL DEFAULT 'month'
        CHECK (period IN ('month', 'year', 'lifetime')),
    -- 方案描述
    description TEXT,
    -- 功能列表
    features TEXT[] NOT NULL DEFAULT '{}'::text[],
    -- 是否启用
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- 排序优先级
    priority INTEGER NOT NULL DEFAULT 0,
    -- 是否推荐（展示推荐标签）
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pricing_plans IS '会员订阅定价方案（公开只读）';

-- ------------------------------------------------------------
-- 9. 订阅记录表 (subscriptions)
-- 用户订阅状态与支付记录
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 订阅用户
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 关联定价方案
    plan_id TEXT REFERENCES public.pricing_plans(id),
    -- 方案名称（冗余，便于查询）
    plan_name TEXT NOT NULL,
    -- 状态: active=生效中 / pending=待支付 / cancelled=已取消 / expired=已过期
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('active', 'pending', 'cancelled', 'expired')),
    -- 支付方式: stripe|alipay|wechat|demo
    payment_method TEXT,
    -- 支付服务商: stripe|alipay|wechat|manual
    payment_provider TEXT,
    -- 服务商订阅 ID（Stripe subscription ID 等）
    provider_subscription_id TEXT,
    -- 订阅开始日期
    start_date TIMESTAMPTZ,
    -- 订阅结束日期
    end_date TIMESTAMPTZ,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subscriptions IS '用户订阅记录';
COMMENT ON COLUMN public.subscriptions.status IS 'active|pending|cancelled|expired';
COMMENT ON COLUMN public.subscriptions.provider_subscription_id IS 'Stripe/WxPay 订阅 ID';

-- ------------------------------------------------------------
-- 触发器: 自动更新 updated_at 列
-- 所有包含 updated_at 的表均使用此触发器
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS '自动更新 updated_at 列为当前时间戳';

-- 为每个表绑定 updated_at 触发器
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'profiles', 'video_analysis', 'scripts', 'storyboards',
        'prompts', 'prompt_templates', 'pricing_plans', 'subscriptions'
    ]
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON public.%I
                FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------
-- 触发器: 新用户注册时自动创建 profile
-- 从 auth.users 的 raw_user_meta_data 中提取 name
-- SECURITY DEFINER 确保触发器有权限插入 profiles
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data ->> 'name',
            split_part(NEW.email, '@', 1)
        ),
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS '新用户注册时自动创建 profiles 记录';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 迁移 001 完成
-- ============================================================