# 爆款工厂AI

AI驱动的爆款视频创作平台，提供视频分析、脚本生成、分镜设计、提示词工具等一站式创作工具。

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript
- **样式**: TailwindCSS 3
- **UI组件**: NextUI 2（作为 Theme Provider 包裹，页面主要使用原生表单元素）
- **图标**: Lucide React
- **后端**: Supabase
- **数据库**: PostgreSQL (Supabase)
- **支付**: Stripe
- **部署**: Vercel

## 功能模块

### 1. 用户认证系统
- 安全的用户注册、登录、密码重置功能
- 支持第三方OAuth登录（Google、GitHub）
- 用户角色与权限管理

### 2. 爆款视频分析模块
- 视频链接输入界面，支持主流视频平台链接解析
- 视频内容分析功能，输出结构化数据：
  - 标题结构分析（主标题、副标题、关键词）
  - 情绪钩子识别与分类
  - 冲突点定位与强度评估
  - 反转点时间戳与内容描述

### 3. AI脚本仿写功能
- 基于视频分析结果，AI驱动的原创脚本生成器
- 支持脚本风格选择（搞笑、情感、知识、悬疑、励志、测评）
- 脚本编辑与实时预览功能

### 4. AI分镜生成系统
- 自动分镜脚本生成功能，将文字脚本转换为视觉分镜
- 支持分镜类型选择（写实、动漫、卡通、赛博朋克、极简）
- 分镜预览与导出功能

### 5. AI提示词生成工具
- 针对主流AI图像生成工具的提示词生成器：
  - Midjourney
  - Flux
  - 即梦
  - 可灵
- 提示词模板管理与历史记录功能

### 6. 用户历史记录管理
- 用户操作历史记录系统
- 历史记录分类、搜索与筛选功能
- 历史项目的重新编辑与二次生成

### 7. 会员订阅系统
- 多档次会员套餐（免费、基础、高级、企业）
- 支付集成（支持微信支付、支付宝、信用卡）
- 会员权益管理与权限控制

## 设计特点

- **视觉风格**: 黑金科技风与动漫赛博朋克元素
- **深色/浅色模式**: 支持主题切换
- **响应式设计**: 移动端优先开发策略
- **性能优化**: 页面加载优化、资源懒加载与缓存策略

## 项目结构

```
├── src/
│   ├── components/          # 通用组件
│   │   ├── Navbar.tsx
│   │   ├── Layout.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── RoleGuard.tsx
│   │   └── Footer.tsx
│   ├── pages/               # 页面路由
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── dashboard.tsx
│   │   ├── video-analysis.tsx
│   │   ├── script-generator.tsx
│   │   ├── storyboard.tsx
│   │   ├── prompt-generator.tsx
│   │   ├── history.tsx
│   │   ├── pricing.tsx
│   │   ├── profile.tsx
│   │   └── api/             # API路由
│   │       ├── analysis/
│   │       ├── script/
│   │       ├── storyboard/
│   │       ├── prompt/
│   │       ├── subscription/
│   │       ├── history.ts
│   │       └── user.ts
│   ├── hooks/               # 自定义hooks
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── lib/                 # 工具函数
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── llm.ts
│   │   ├── rate-limit.ts
│   │   ├── schemas.ts
│   │   ├── utils.ts
│   │   └── video-parser.ts
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   └── styles/              # 全局样式
│       └── globals.css
├── .github/workflows/       # CI/CD配置
├── supabase/                # Supabase配置
│   └── migrations/
│       └── 001_initial_schema.sql
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
└── .env.example             # 环境变量模板
```

## 安装与运行

### 前置要求

- Node.js >= 20
- Supabase账户

### 步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd baokuan-ai-factory
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   ```

   编辑 `.env.local` 文件，填入所需服务的配置。完整变量列表请参考 [`.env.example`](./.env.example)。

   **必需配置（最小可运行）**
   ```bash
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **AI 功能配置（至少配置一个 LLM）**
   ```bash
   OPENAI_API_KEY=sk-your-openai-api-key
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4o-mini
   ```

   **OAuth 登录配置（可选）**
   
   在 Supabase Dashboard > Authentication > Providers 中启用 Google / GitHub，
   并将回调地址设置为 `https://your-app-url.com/api/auth/callback`。
   前端通过 `supabase.auth.signInWithOAuth` 直接调用，无需在 `.env.local` 中配置客户端 ID。

   **支付配置（可选，用于会员订阅）**
   ```bash
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
   STRIPE_PRICE_BASIC=price_basic_id
   STRIPE_PRICE_PREMIUM=price_premium_id
   ```

4. **配置Supabase**
   - 创建Supabase项目
   - 在Supabase SQL Editor 中执行 `supabase/migrations/001_initial_schema.sql` 创建表、触发器、RLS 策略和默认数据
   - 启用Google和GitHub OAuth登录（可选）

5. **运行开发服务器**
   ```bash
   npm run dev
   ```

6. **构建生产版本**
   ```bash
   npm run build
   ```

7. **启动生产服务器**
   ```bash
   npm run start
   ```

## 部署

### Vercel部署

1. 连接GitHub仓库到Vercel
2. 设置环境变量
3. 自动部署

## API接口

### 视频分析
- `POST /api/analysis/video` - 视频分析

### 脚本生成
- `POST /api/script/generate` - 生成脚本

### 分镜生成
- `POST /api/storyboard/generate` - 生成分镜

### 提示词生成
- `POST /api/prompt/generate` - 生成提示词
- `GET /api/prompt/templates` - 获取模板
- `POST /api/prompt/templates` - 创建模板

### 历史记录
- `GET /api/history` - 获取历史记录

### 订阅管理
- `GET /api/subscription/plans` - 获取定价计划
- `GET /api/subscription/status` - 获取当前用户订阅状态
- `POST /api/subscription/create` - 创建订阅记录
- `POST /api/subscription/checkout` - 创建 Stripe Checkout 会话
- `POST /api/subscription/webhook` - Stripe Webhook 回调

### 用户管理
- `GET /api/user` - 获取用户信息
- `PUT /api/user` - 更新用户信息

## 数据库设计

参考 `migrations/` 目录中的SQL文件，包含所有表结构、索引和RLS策略。

## 安全措施

- 数据加密存储与传输
- 防SQL注入（使用参数化查询）
- 防XSS攻击（输入验证与输出转义）
- Row Level Security (RLS)
- JWT认证
- 速率限制

## 性能优化

- 代码分割与懒加载
- 图片优化（Next.js Image组件）
- 静态资源缓存
- 数据库索引优化
- 查询缓存

## 许可证

MIT License