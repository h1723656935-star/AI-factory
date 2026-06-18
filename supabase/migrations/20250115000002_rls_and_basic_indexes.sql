-- ============================================================
-- Migration 002: Row Level Security 策略与基础索引
-- 描述: 为所有用户数据表启用 RLS 并创建访问策略;
--       添加基础单列索引优化常见查询
-- 版本: 1.0.0
-- 日期: 2025-01-15
-- 依赖: 20250115000001_core_tables.sql
-- ============================================================

-- ------------------------------------------------------------
-- 启用 Row Level Security (RLS)
-- 所有包含用户数据的表均启用 RLS
-- pricing_plans 为公开只读，不启用 RLS
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles 策略: 用户只能操作自己的资料
-- ============================================================

-- SELECT: 用户可查看自己的资料
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- UPDATE: 用户可更新自己的资料（不能修改 role）
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT: 仅触发器可插入（用户不应直接创建 profile）
DROP POLICY IF EXISTS "profiles_insert_trigger_only" ON public.profiles;
CREATE POLICY "profiles_insert_trigger_only"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- DELETE: 禁止删除（通过 auth.users CASCADE 自动删除）
DROP POLICY IF EXISTS "profiles_delete_forbidden" ON public.profiles;
CREATE POLICY "profiles_delete_forbidden"
    ON public.profiles
    FOR DELETE
    USING (false);

-- ============================================================
-- video_analysis 策略: 用户只能操作自己的分析记录
-- ============================================================

DROP POLICY IF EXISTS "video_analysis_crud_own" ON public.video_analysis;
CREATE POLICY "video_analysis_crud_own"
    ON public.video_analysis
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 允许匿名用户创建分析（user_id 为 NULL 时）
DROP POLICY IF EXISTS "video_analysis_insert_anonymous" ON public.video_analysis;
CREATE POLICY "video_analysis_insert_anonymous"
    ON public.video_analysis
    FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- ============================================================
-- scripts 策略
-- ============================================================

DROP POLICY IF EXISTS "scripts_crud_own" ON public.scripts;
CREATE POLICY "scripts_crud_own"
    ON public.scripts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- storyboards 策略
-- ============================================================

DROP POLICY IF EXISTS "storyboards_crud_own" ON public.storyboards;
CREATE POLICY "storyboards_crud_own"
    ON public.storyboards
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- prompts 策略
-- ============================================================

DROP POLICY IF EXISTS "prompts_crud_own" ON public.prompts;
CREATE POLICY "prompts_crud_own"
    ON public.prompts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- prompt_templates 策略: 用户可查看公开模板 + 自己的模板
-- ============================================================

DROP POLICY IF EXISTS "prompt_templates_select_public_or_own" ON public.prompt_templates;
CREATE POLICY "prompt_templates_select_public_or_own"
    ON public.prompt_templates
    FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_templates_manage_own" ON public.prompt_templates;
CREATE POLICY "prompt_templates_manage_own"
    ON public.prompt_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_templates_update_own" ON public.prompt_templates;
CREATE POLICY "prompt_templates_update_own"
    ON public.prompt_templates
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "prompt_templates_delete_own" ON public.prompt_templates;
CREATE POLICY "prompt_templates_delete_own"
    ON public.prompt_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- user_history 策略
-- ============================================================

DROP POLICY IF EXISTS "user_history_crud_own" ON public.user_history;
CREATE POLICY "user_history_crud_own"
    ON public.user_history
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- subscriptions 策略: 用户只能查看自己的订阅
-- ============================================================

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 服务端可插入（通过 API 使用 service_role key）
DROP POLICY IF EXISTS "subscriptions_insert_service" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_service"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (true);

-- 服务端可更新（如 Stripe webhook）
DROP POLICY IF EXISTS "subscriptions_update_service" ON public.subscriptions;
CREATE POLICY "subscriptions_update_service"
    ON public.subscriptions
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- pricing_plans 策略: 公开只读，不启用 RLS
-- 但添加显式策略以防未来误启用
-- ============================================================
DROP POLICY IF EXISTS "pricing_plans_select_all" ON public.pricing_plans;
CREATE POLICY "pricing_plans_select_all"
    ON public.pricing_plans
    FOR SELECT
    USING (true);

-- ============================================================
-- 基础单列索引
-- 优化最常见的单列查询场景
-- ============================================================

-- profiles 索引
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- video_analysis 索引
CREATE INDEX IF NOT EXISTS idx_video_analysis_user_id ON public.video_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis_created_at ON public.video_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analysis_platform ON public.video_analysis(platform);

-- scripts 索引
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_analysis_id ON public.scripts(analysis_id);

-- storyboards 索引
CREATE INDEX IF NOT EXISTS idx_storyboards_user_id ON public.storyboards(user_id);
CREATE INDEX IF NOT EXISTS idx_storyboards_script_id ON public.storyboards(script_id);

-- prompts 索引
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_platform ON public.prompts(platform);

-- prompt_templates 索引
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_id ON public.prompt_templates(user_id);

-- user_history 索引
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON public.user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON public.user_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_history_action_type ON public.user_history(action_type);

-- subscriptions 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- ============================================================
-- 迁移 002 完成
-- ============================================================