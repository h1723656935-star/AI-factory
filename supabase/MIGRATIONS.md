# 爆款工厂AI - Supabase 数据库迁移文档

## 迁移概览

| 迁移文件 | 描述 | 状态 |
|---------|------|------|
| `20250115000001_core_tables.sql` | 核心表结构定义（9 张表 + 触发器） | ✅ |
| `20250115000002_rls_and_basic_indexes.sql` | RLS 策略（24 条）+ 基础索引（18 个） | ✅ |
| `20250115000003_composite_indexes_and_search.sql` | 复合索引（14 个）+ 全文搜索 GIN 索引 | ✅ |
| `20250115000004_audit_logs_and_security.sql` | 审计日志表 + 安全视图 + 脱敏函数 | ✅ |
| `20250115000005_functions_and_seed_data.sql` | 存储过程 + 种子数据（4 计划 + 6 模板） | ✅ |

## 数据库表清单

| 表名 | 用途 | RLS | 主要索引 |
|------|------|-----|---------|
| `profiles` | 用户资料 | ✅ | role, name(trgm) |
| `video_analysis` | 视频分析结果 | ✅ | user_id, status, platform, user_created |
| `scripts` | AI 脚本 | ✅ | user_id, analysis_id, user_style |
| `storyboards` | 分镜设计 | ✅ | user_id, script_id, user_created |
| `prompts` | AI 提示词 | ✅ | user_id, platform, user_platform_created |
| `prompt_templates` | 提示词模板 | ✅ | user_id, public_created, public_platform |
| `user_history` | 操作历史 | ✅ | user_id, action_type, title(gin), description(gin) |
| `pricing_plans` | 定价方案 | ❌ | active_priority |
| `subscriptions` | 订阅记录 | ✅ | user_id, status, provider_id, active |
| `audit_logs` | 审计日志 | ✅ | user_id, action, resource |

## 安全特性

- **RLS 全面启用**: 所有用户数据表均通过 Row Level Security 实现数据隔离
- **服务端通道**: `subscriptions` 和 `audit_logs` 表支持 `service_role` 写入，供 Webhook 使用
- **数据脱敏**: `mask_email()`, `mask_phone()`, `mask_ip()` 三个脱敏函数
- **安全视图**: `public_user_profiles` 隐藏 email; `admin_user_profiles` 仅管理员可查
- **审计日志**: `audit_logs` 表记录所有关键操作，仅管理员可读

## 种子数据

- **定价方案**: 免费版 / 基础版(¥29) / 高级版(¥99) / 企业版(¥499)
- **提示词模板**: 6 个系统预设模板（电影级人像、赛博朋克、动漫角色、产品摄影、极简设计、复古胶片）

## 业务函数

| 函数 | 用途 |
|------|------|
| `handle_new_user()` | 新用户自动创建 profile |
| `update_updated_at_column()` | 自动更新 updated_at |
| `get_user_usage_stats()` | 用户使用统计 |
| `get_user_subscription_info()` | 订阅与配额信息 |
| `check_user_quota()` | 配额检查 |
| `get_user_timeline()` | 操作时间线 |
| `write_audit_log()` | 审计日志写入 |
| `cleanup_expired_data()` | 过期数据清理 |
| `repair_orphaned_records()` | 孤立记录修复 |

## 应用方式

### 本地开发
```bash
supabase db reset          # 重置本地数据库
supabase db push            # 推送迁移到本地
```

### 生产环境
```bash
supabase link --project-ref <project-id>
supabase db push
```

### 手动执行（SQL Editor）
在 Supabase SQL Editor 中按顺序执行 `20250115000001` 至 `20250115000005` 迁移文件。

## 验证结果

| 检查项 | 结果 |
|--------|------|
| ESLint | ✅ 0 warnings / 0 errors |
| TypeScript | ✅ 通过 |
| Jest | ✅ 50/50 通过 |
| Build | ✅ 通过 |

## 迁移原则

1. **幂等性**: 所有语句使用 `IF NOT EXISTS` / `OR REPLACE` / `DROP IF EXISTS` + `CREATE`
2. **有序性**: 迁移按依赖顺序编号，确保执行顺序正确
3. **可回滚**: 每个迁移独立，可逐级回滚（手动执行反向操作）
4. **文档化**: 每张表、每个函数均有 `COMMENT` 说明
5. **兼容性**: 兼容 PostgreSQL 15+ 和 Supabase CLI 最新版