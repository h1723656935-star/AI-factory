-- ============================================================
-- Migration 004: 审计日志、安全视图与数据脱敏
-- 描述: 创建审计日志表用于合规记录;
--       创建公开用户视图隐藏敏感字段;
--       实现数据脱敏函数用于日志与导出
-- 版本: 1.0.0
-- 日期: 2025-01-15
-- 依赖: 20250115000002_rls_and_basic_indexes.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. 审计日志表 (audit_logs)
-- 记录关键操作，满足合规审计需求
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 操作者（可为 NULL，如匿名操作）
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- 操作类型: login|logout|create|update|delete|export|payment|admin
    action TEXT NOT NULL,
    -- 资源类型: video_analysis|script|storyboard|prompt|template|subscription|profile
    resource_type TEXT,
    -- 资源 ID
    resource_id TEXT,
    -- 客户端 IP
    ip_address TEXT,
    -- 客户端 User-Agent
    user_agent TEXT,
    -- 扩展元数据
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS '审计日志表，用于合规审计与安全分析';
COMMENT ON COLUMN public.audit_logs.action IS 'login|logout|create|update|delete|export|payment|admin';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'video_analysis|script|storyboard|prompt|template|subscription|profile';

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);

-- 审计日志 RLS: 仅管理员可读
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
    ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 服务端（service_role）可写入
DROP POLICY IF EXISTS "audit_logs_insert_service" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_service"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- 2. 审计日志写入函数
-- 封装审计日志写入逻辑，便于 API 层调用
-- ============================================================
CREATE OR REPLACE FUNCTION public.write_audit_log(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (
        user_id, action, resource_type, resource_id,
        ip_address, user_agent, metadata
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_ip_address, p_user_agent, p_metadata
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.write_audit_log IS '写入审计日志，返回日志 ID';

-- ============================================================
-- 3. 公开用户视图 (public_user_profiles)
-- 隐藏 email 等敏感字段，供公开页面使用
-- ============================================================
CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT
    id,
    name,
    avatar_url,
    role,
    preferences,
    created_at
FROM public.profiles;

COMMENT ON VIEW public.public_user_profiles IS '公开用户资料视图，隐藏 email 等敏感字段';

-- ============================================================
-- 4. 管理员视图 (admin_user_profiles)
-- 包含完整字段，仅管理员可访问
-- ============================================================
CREATE OR REPLACE VIEW public.admin_user_profiles AS
SELECT
    id,
    email,
    name,
    avatar_url,
    role,
    preferences,
    created_at,
    updated_at
FROM public.profiles
WHERE EXISTS (
    SELECT 1 FROM public.profiles AS p
    WHERE p.id = auth.uid() AND p.role = 'admin'
);

COMMENT ON VIEW public.admin_user_profiles IS '管理员视图，含邮箱等完整字段';

-- ============================================================
-- 5. 数据脱敏函数
-- ============================================================

-- 5.1 邮箱脱敏
CREATE OR REPLACE FUNCTION public.mask_email(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_at_pos INT;
BEGIN
    IF p_email IS NULL OR p_email = '' THEN
        RETURN '';
    END IF;
    v_at_pos := position('@' IN p_email);
    IF v_at_pos <= 1 THEN
        RETURN p_email;
    END IF;
    RETURN substring(p_email FROM 1 FOR 1)
        || '***@'
        || substring(p_email FROM v_at_pos + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.mask_email IS '邮箱脱敏: u***@domain.com';

-- 5.2 手机号脱敏
CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_phone IS NULL OR length(p_phone) < 7 THEN
        RETURN p_phone;
    END IF;
    RETURN substring(p_phone FROM 1 FOR 3)
        || '****'
        || substring(p_phone FROM length(p_phone) - 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.mask_phone IS '手机号脱敏: 138****5678';

-- 5.3 IP 地址脱敏
CREATE OR REPLACE FUNCTION public.mask_ip(p_ip TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_ip IS NULL THEN
        RETURN NULL;
    END IF;
    -- IPv4: 192.168.xxx.xxx
    IF p_ip ~ '^\d+\.\d+\.\d+\.\d+$' THEN
        RETURN regexp_replace(p_ip, '(\d+\.\d+)\.\d+\.\d+', '\1.***.***');
    END IF;
    -- IPv6/其他: 保留前缀
    RETURN substring(p_ip FROM 1 FOR 7) || '...';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.mask_ip IS 'IP 地址脱敏';

-- ============================================================
-- 6. 表分区备注
-- 当日志表数据量增长时，建议按月分区
-- ============================================================
COMMENT ON TABLE public.user_history IS
    '用户操作历史记录。超过 500 万行建议按 created_at 进行月分区。分区示例: user_history_2025_01, user_history_2025_02 ...';

COMMENT ON TABLE public.audit_logs IS
    '审计日志表，仅管理员可读。建议按 created_at 月分区，并配置自动归档策略（如 90 天后迁移至冷存储）。';

-- ============================================================
-- 迁移 004 完成
-- ============================================================