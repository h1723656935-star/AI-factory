-- ============================================================
-- Migration: 模板版本控制与批量操作
-- 描述: 创建模板版本表、批量操作支持
-- 日期: 2025-06-19
-- ============================================================

-- ------------------------------------------------------------
-- 1. 模板版本表 (template_versions)
-- 存储模板的版本历史，支持回滚和对比
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.template_versions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 关联模板 ID
    template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
    -- 版本号（递增）
    version_number INTEGER NOT NULL DEFAULT 1,
    -- 版本内容快照（完整模板内容）
    content JSONB NOT NULL,
    -- 版本描述/变更说明
    description TEXT,
    -- 创建者
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- 创建时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.template_versions IS '模板版本历史表，支持版本回滚和对比';
COMMENT ON COLUMN public.template_versions.content IS '模板内容的完整快照，包括 name, platform, style, category, template, description, aspectRatio';

-- 版本表索引
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON public.template_versions(template_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON public.template_versions(template_id, version_number DESC);

-- 版本号唯一约束
DROP INDEX IF EXISTS idx_template_versions_unique;
CREATE UNIQUE INDEX idx_template_versions_unique ON public.template_versions(template_id, version_number);

-- ------------------------------------------------------------
-- 2. 模板版本序列函数
-- 自动为模板生成下一个版本号
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_template_version(p_template_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_max_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) INTO v_max_version
    FROM public.template_versions
    WHERE template_id = p_template_id;

    RETURN v_max_version + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_next_template_version IS '获取模板的下一个版本号';

-- ------------------------------------------------------------
-- 3. 创建版本快照函数
-- 保存模板当前状态作为新版本
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_template_version(
    p_template_id UUID,
    p_content JSONB,
    p_description TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
    v_next_version INTEGER;
BEGIN
    -- 获取下一个版本号
    v_next_version := public.get_next_template_version(p_template_id);

    -- 插入版本记录
    INSERT INTO public.template_versions (
        template_id, version_number, content, description, created_by
    ) VALUES (
        p_template_id, v_next_version, p_content, p_description, p_created_by
    ) RETURNING id INTO v_version_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_template_version IS '创建模板版本快照';

-- ------------------------------------------------------------
-- 4. 获取模板版本列表
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_template_versions(p_template_id UUID)
RETURNS TABLE (
    id UUID,
    version_number INTEGER,
    content JSONB,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    creator_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tv.id,
        tv.version_number,
        tv.content,
        tv.description,
        tv.created_by,
        tv.created_at,
        COALESCE(p.name, '未知')::TEXT as creator_name
    FROM public.template_versions tv
    LEFT JOIN public.profiles p ON tv.created_by = p.id
    WHERE tv.template_id = p_template_id
    ORDER BY tv.version_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_template_versions IS '获取模板的所有版本';

-- ------------------------------------------------------------
-- 5. 回滚到指定版本
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rollback_template_version(
    p_version_id UUID,
    p_rollback_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version RECORD;
    v_new_version_id UUID;
BEGIN
    -- 获取目标版本信息
    SELECT * INTO v_version
    FROM public.template_versions
    WHERE id = p_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '版本不存在';
    END IF;

    -- 更新模板为版本内容
    UPDATE public.prompt_templates
    SET
        name = (v_version.content->>'name')::TEXT,
        platform = (v_version.content->>'platform')::TEXT,
        style = (v_version.content->>'style')::TEXT,
        category = COALESCE((v_version.content->>'category')::TEXT, 'general'),
        prompt = (v_version.content->>'prompt')::TEXT,
        description = (v_version.content->>'description')::TEXT,
        aspect_ratio = (v_version.content->>'aspectRatio')::TEXT,
        updated_at = now()
    WHERE id = v_version.template_id;

    -- 创建新版本记录（标记为回滚）
    v_new_version_id := public.create_template_version(
        v_version.template_id,
        v_version.content,
        '回滚到版本 v' || v_version.version_number,
        p_rollback_by
    );

    RETURN v_new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.rollback_template_version IS '回滚模板到指定版本';

-- ------------------------------------------------------------
-- 6. RLS 策略 - 模板版本表
-- ------------------------------------------------------------
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- 用户可查看自己的模板版本，管理员可查看所有
DROP POLICY IF EXISTS "template_versions_select" ON public.template_versions;
CREATE POLICY "template_versions_select"
    ON public.template_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.prompt_templates pt
            WHERE pt.id = template_versions.template_id
              AND (pt.user_id = auth.uid() OR pt.is_public = true)
        )
    );

-- 仅管理员或模板所有者可插入版本
DROP POLICY IF EXISTS "template_versions_insert" ON public.template_versions;
CREATE POLICY "template_versions_insert"
    ON public.template_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.prompt_templates pt
            WHERE pt.id = template_versions.template_id
              AND pt.user_id = auth.uid()
        )
    );

-- 仅管理员可删除版本
DROP POLICY IF EXISTS "template_versions_delete" ON public.template_versions;
CREATE POLICY "template_versions_delete"
    ON public.template_versions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 服务端可插入（用于自动版本记录）
DROP POLICY IF EXISTS "template_versions_insert_service" ON public.template_versions;
CREATE POLICY "template_versions_insert_service"
    ON public.template_versions
    FOR INSERT
    WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. 审计日志扩展 - 模板操作
-- ------------------------------------------------------------
-- 模板版本相关操作类型已存在于 audit_logs.action CHECK 约束中
-- template_version_create | template_version_rollback | template_batch_operation

-- ------------------------------------------------------------
-- 8. 批量操作支持（无表结构变更，仅 API 逻辑）
-- ------------------------------------------------------------
-- 批量操作通过现有 API 实现，无需新增表结构

-- ============================================================
-- Migration 完成
-- ============================================================
