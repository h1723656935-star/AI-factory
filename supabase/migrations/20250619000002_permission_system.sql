-- ============================================================
-- Migration: 细粒度权限系统
-- 描述: 创建权限表、角色权限关联、用户权限覆盖
-- 日期: 2025-06-19
-- ============================================================

-- ------------------------------------------------------------
-- 1. 权限定义表 (permissions)
-- 定义系统中所有可控制的权限点
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions
(
    id TEXT PRIMARY KEY,
    -- 权限名称（唯一标识）
    name TEXT NOT NULL,
    -- 权限描述
    description TEXT,
    -- 权限分组（用于UI展示）
    category TEXT NOT NULL DEFAULT 'general',
    -- 是否为危险权限
    is_dangerous BOOLEAN DEFAULT false,
    -- 创建时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.permissions IS '权限定义表';
COMMENT ON COLUMN public.permissions.id IS '权限ID，格式：resource:action，如 template:create';
COMMENT ON COLUMN public.permissions.category IS '权限分组：template, prompt, user, system';

-- ------------------------------------------------------------
-- 2. 角色权限表 (role_permissions)
-- 定义每个角色拥有的权限
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 角色
    role TEXT NOT NULL REFERENCES pg_enum(enumlabel) ON DELETE CASCADE,
    -- 权限ID
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    -- 创建时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- 唯一约束
    UNIQUE(role, permission_id)
);

COMMENT ON TABLE public.role_permissions IS '角色权限关联表';

-- ------------------------------------------------------------
-- 3. 用户权限覆盖表 (user_permissions)
-- 为特定用户授予或撤销权限（覆盖角色默认权限）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_permissions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- 用户ID
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- 权限ID
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    -- 是否授予（true=授予，false=撤销）
    granted BOOLEAN NOT NULL DEFAULT true,
    -- 授权原因
    reason TEXT,
    -- 授权人
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- 创建时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- 唯一约束
    UNIQUE(user_id, permission_id)
);

COMMENT ON TABLE public.user_permissions IS '用户权限覆盖表';

-- ------------------------------------------------------------
-- 4. 索引
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- ------------------------------------------------------------
-- 5. 初始化权限定义
-- ------------------------------------------------------------
INSERT INTO public.permissions (id, name, description, category, is_dangerous) VALUES
-- 模板权限
('template:view', '查看模板', '查看模板列表和详情', 'template', false),
('template:create', '创建模板', '创建新的模板', 'template', false),
('template:update', '更新模板', '修改现有模板', 'template', false),
('template:delete', '删除模板', '删除模板', 'template', true),
('template:export', '导出模板', '导出模板数据', 'template', false),
('template:import', '导入模板', '导入模板数据', 'template', true),
('template:version', '版本控制', '查看和回滚模板版本', 'template', false),
('template:batch', '批量操作', '批量删除/更新模板', 'template', true),

-- 提示词权限
('prompt:generate', '生成提示词', '使用提示词生成功能', 'prompt', false),
('prompt:optimize', '优化提示词', '使用提示词优化功能', 'prompt', false),
('prompt:video_analysis', '视频反推', '使用视频反推功能', 'prompt', false),
('prompt:unlimited', '无限制生成', '无次数限制生成提示词', 'prompt', true),

-- 用户管理权限
('user:view', '查看用户', '查看用户列表和详情', 'user', false),
('user:update', '更新用户', '修改用户信息', 'user', true),
('user:role', '修改角色', '修改用户角色', 'user', true),
('user:ban', '封禁用户', '封禁/解封用户', 'user', true),

-- 系统管理权限
('system:audit', '审计日志', '查看系统审计日志', 'system', false),
('system:config', '系统配置', '修改系统配置', 'system', true),
('system:admin', '管理员权限', '完整的管理员权限', 'system', true)

ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. 初始化角色权限
-- ------------------------------------------------------------
-- free 角色：基础权限
INSERT INTO public.role_permissions (role, permission_id) VALUES
('free', 'template:view'),
('free', 'prompt:generate'),
('free', 'prompt:optimize')
ON CONFLICT (role, permission_id) DO NOTHING;

-- basic 角色：基础+更多
INSERT INTO public.role_permissions (role, permission_id) VALUES
('basic', 'template:view'),
('basic', 'template:create'),
('basic', 'template:update'),
('basic', 'template:export'),
('basic', 'prompt:generate'),
('basic', 'prompt:optimize'),
('basic', 'prompt:video_analysis')
ON CONFLICT (role, permission_id) DO NOTHING;

-- premium 角色：高级权限
INSERT INTO public.role_permissions (role, permission_id) VALUES
('premium', 'template:view'),
('premium', 'template:create'),
('premium', 'template:update'),
('premium', 'template:delete'),
('premium', 'template:export'),
('premium', 'template:import'),
('premium', 'template:version'),
('premium', 'prompt:generate'),
('premium', 'prompt:optimize'),
('premium', 'prompt:video_analysis')
ON CONFLICT (role, permission_id) DO NOTHING;

-- enterprise 角色：企业权限
INSERT INTO public.role_permissions (role, permission_id) VALUES
('enterprise', 'template:view'),
('enterprise', 'template:create'),
('enterprise', 'template:update'),
('enterprise', 'template:delete'),
('enterprise', 'template:export'),
('enterprise', 'template:import'),
('enterprise', 'template:version'),
('enterprise', 'template:batch'),
('enterprise', 'prompt:generate'),
('enterprise', 'prompt:optimize'),
('enterprise', 'prompt:video_analysis'),
('enterprise', 'prompt:unlimited')
ON CONFLICT (role, permission_id) DO NOTHING;

-- admin 角色：全部权限
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. 权限检查函数
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_permission_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_has_role_permission BOOLEAN;
    v_user_override BOOLEAN;
BEGIN
    -- 获取用户角色
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    IF v_role IS NULL THEN RETURN false; END IF;

    -- admin 角色拥有所有权限
    IF v_role = 'admin' THEN RETURN true; END IF;

    -- 检查角色权限
    SELECT EXISTS (
        SELECT 1 FROM public.role_permissions
        WHERE role = v_role AND permission_id = p_permission_id
    ) INTO v_has_role_permission;

    -- 检查用户权限覆盖
    SELECT granted INTO v_user_override
    FROM public.user_permissions
    WHERE user_id = p_user_id AND permission_id = p_permission_id;

    -- 如果有用户级覆盖，以覆盖为准
    IF v_user_override IS NOT NULL THEN
        RETURN v_user_override;
    END IF;

    RETURN v_has_role_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.user_has_permission IS '检查用户是否拥有指定权限';

-- ------------------------------------------------------------
-- 8. 获取用户所有权限
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (permission_id TEXT, permission_name TEXT, source TEXT) AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- 获取用户角色
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    IF v_role IS NULL THEN RETURN; END IF;

    -- admin 拥有所有权限
    IF v_role = 'admin' THEN
        RETURN QUERY
        SELECT p.id, p.name, 'admin'::TEXT
        FROM public.permissions p;
        RETURN;
    END IF;

    -- 返回角色权限 + 用户覆盖
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        CASE
            WHEN up.granted IS NOT NULL THEN 'user_override'
            ELSE 'role'
        END::TEXT as source
    FROM public.permissions p
    LEFT JOIN public.role_permissions rp ON rp.permission_id = p.id AND rp.role = v_role
    LEFT JOIN public.user_permissions up ON up.permission_id = p.id AND up.user_id = p_user_id
    WHERE
        (rp.id IS NOT NULL AND (up.granted IS NULL OR up.granted = true))
        OR (up.granted = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_permissions IS '获取用户所有权限';

-- ------------------------------------------------------------
-- 9. RLS 策略
-- ------------------------------------------------------------
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- permissions: 所有人可读
DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true);

-- role_permissions: 所有人可读
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT USING (true);

-- user_permissions: 仅管理员可管理
DROP POLICY IF EXISTS "user_permissions_select" ON public.user_permissions;
CREATE POLICY "user_permissions_select"
    ON public.user_permissions
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "user_permissions_insert" ON public.user_permissions;
CREATE POLICY "user_permissions_insert"
    ON public.user_permissions
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "user_permissions_delete" ON public.user_permissions;
CREATE POLICY "user_permissions_delete"
    ON public.user_permissions
    FOR DELETE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================
-- Migration 完成
-- ============================================================
