-- ============================================================
-- Migration 003: 复合索引与全文搜索优化
-- 描述: 添加复合索引覆盖高频多条件查询;
--       启用 pg_trgm 扩展并创建全文搜索 GIN 索引;
--       添加部分索引优化特定状态查询
-- 版本: 1.0.0
-- 日期: 2025-01-15
-- 依赖: 20250115000002_rls_and_basic_indexes.sql
-- ============================================================

-- ------------------------------------------------------------
-- 扩展: pg_trgm (三元组模糊匹配)
-- 用于 LIKE/ILIKE 查询加速，配合 GIN 索引
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------
-- video_analysis 复合索引
-- 覆盖: 按用户+时间排序、按状态过滤
-- ------------------------------------------------------------

-- 用户查看自己的分析记录（最常见查询）
CREATE INDEX IF NOT EXISTS idx_video_analysis_user_created
    ON public.video_analysis(user_id, created_at DESC);

-- 查询正在处理中的分析（用于轮询状态）
CREATE INDEX IF NOT EXISTS idx_video_analysis_user_status
    ON public.video_analysis(user_id, status);

-- 部分索引: 仅索引 processing 状态（减少索引大小）
CREATE INDEX IF NOT EXISTS idx_video_analysis_status_processing
    ON public.video_analysis(created_at)
    WHERE status = 'processing';

-- ------------------------------------------------------------
-- scripts 复合索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_scripts_user_created
    ON public.scripts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scripts_user_style
    ON public.scripts(user_id, style);

-- ------------------------------------------------------------
-- storyboards 复合索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_storyboards_user_created
    ON public.storyboards(user_id, created_at DESC);

-- ------------------------------------------------------------
-- prompts 复合索引
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_prompts_user_created
    ON public.prompts(user_id, created_at DESC);

-- 按平台筛选用户提示词
CREATE INDEX IF NOT EXISTS idx_prompts_user_platform_created
    ON public.prompts(user_id, platform, created_at DESC);

-- ------------------------------------------------------------
-- prompt_templates 索引
-- ------------------------------------------------------------

-- 公开模板查询（最常见）
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public_created
    ON public.prompt_templates(is_public, created_at DESC)
    WHERE is_public = true;

-- 按平台查询公开模板
CREATE INDEX IF NOT EXISTS idx_prompt_templates_public_platform
    ON public.prompt_templates(platform, created_at DESC)
    WHERE is_public = true;

-- ------------------------------------------------------------
-- user_history 全文搜索索引
-- 使用 pg_trgm 的 GIN 索引加速 LIKE/ILIKE 模糊查询
-- ------------------------------------------------------------

-- 标题字段全文搜索
CREATE INDEX IF NOT EXISTS idx_user_history_title_trgm
    ON public.user_history
    USING gin (title gin_trgm_ops);

-- 描述字段全文搜索
CREATE INDEX IF NOT EXISTS idx_user_history_description_trgm
    ON public.user_history
    USING gin (description gin_trgm_ops);

-- 按用户+操作类型+时间排序（最常见查询模式）
CREATE INDEX IF NOT EXISTS idx_user_history_user_type_created
    ON public.user_history(user_id, action_type, created_at DESC);

-- ------------------------------------------------------------
-- subscriptions 索引
-- ------------------------------------------------------------

-- 用户订阅状态查询
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
    ON public.subscriptions(user_id, status);

-- Stripe subscription ID 查询（Webhook 回调）
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_id
    ON public.subscriptions(provider_subscription_id)
    WHERE provider_subscription_id IS NOT NULL;

-- 活跃订阅查询
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
    ON public.subscriptions(user_id, start_date DESC)
    WHERE status = 'active';

-- ------------------------------------------------------------
-- pricing_plans 索引
-- ------------------------------------------------------------

-- 获取启用的方案按优先级排序
CREATE INDEX IF NOT EXISTS idx_pricing_plans_active_priority
    ON public.pricing_plans(priority)
    WHERE is_active = true;

-- ------------------------------------------------------------
-- profiles 搜索索引
-- ------------------------------------------------------------

-- 名称搜索（管理后台）
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm
    ON public.profiles
    USING gin (name gin_trgm_ops);

-- ============================================================
-- 迁移 003 完成
-- ============================================================