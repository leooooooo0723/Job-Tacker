# Job Tracker · 求职追踪系统

面向求职者的全流程管理平台。追踪投递进度、管理目标公司、记录面试安排、管理 Offer，并通过内置 AI 助手以自然语言查询和操作求职数据。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router)、React 19、TypeScript、Tailwind CSS 4、shadcn/ui |
| 后端 | Spring Boot 3.3.5、Java 17、Maven |
| 数据库 | MySQL 8（业务数据）|
| 认证 | JWT（jjwt 0.12.6）+ Spring Security |
| AI 助手 | DeepSeek API（function calling） |
| 文件存储 | 本地文件系统 |

---

## 项目结构

```
job-tracker/
├── src/                            # 前端（Next.js）
│   ├── app/
│   │   ├── (auth)/                 # 登录 / 注册页（无需鉴权）
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (app)/                  # 主应用（需登录）
│   │       ├── layout.tsx          # Token 守卫 + Sidebar
│   │       ├── page.tsx            # Dashboard
│   │       ├── applications/       # 投递管理
│   │       ├── companies/          # 公司管理
│   │       ├── offers/             # Offer 管理
│   │       ├── resumes/            # 简历管理
│   │       ├── chat/               # AI 助手
│   │       └── account/            # 账户设置
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 基础组件
│   │   ├── Sidebar.tsx
│   │   └── CycleSelector.tsx
│   └── lib/
│       ├── api.ts                  # 统一请求客户端（自动注入 JWT）
│       ├── constants.ts            # 投递状态常量与颜色映射
│       └── utils.ts
│
├── job-tracker-backend/            # 后端（Spring Boot）
│   └── src/main/java/com/jobtracker/
│       ├── config/                 # Security、CORS、Bean 配置
│       ├── controller/             # REST 接口层
│       ├── service/                # 业务逻辑层
│       ├── entity/mysql/           # JPA 实体
│       ├── repository/mysql/       # JPA Repository
│       ├── security/               # JWT 过滤器与工具类
│       └── dto/                    # 请求 DTO
│   └── src/main/resources/
│       ├── application.yml         # 主配置（含占位符，可提交 git）
│       ├── application-prod.yml    # 生产配置（含真实密钥，已 gitignore）
│       └── application-example.yml # 配置模板，照此创建 prod 文件
│
├── uploads/                        # 简历文件存储（已 gitignore）
├── .github/workflows/              # GitHub Actions 自动部署
│   └── deploy-backend.yml
└── .env.local                      # 前端环境变量（已 gitignore）
```

---

## 架构说明

### 请求链路

```
浏览器
  → Next.js（:3000）
  → lib/api.ts apiFetch（自动附加 Authorization: Bearer <token>）
  → Spring Boot API（:8080）
  → JwtAuthFilter 验证 token
  → Controller → Service → MySQL
  → JSON 响应 → 更新 React State
  → 若 401 → 清除 token → 跳转 /login
```

### 认证流程

1. 用户登录 → 后端签发 JWT（有效期 7 天）
2. 前端将 token 存入 `localStorage`
3. 所有请求由 `apiFetch` 自动附加 `Authorization` 头
4. `JwtAuthFilter` 拦截并验证，写入 `SecurityContext`

### AI 助手

DeepSeek function calling 循环，支持多步操作：

```
用户消息 → ChatService → 构建历史消息列表 → 调用 DeepSeek API
  → 若返回 tool_calls → 执行对应工具（查询/更新数据库）→ 追加结果 → 再次调用
  → 直到返回最终文本 → 保存至 MySQL → 返回前端
```

可用工具：`get_today_schedule`、`get_applications_summary`、`add_event`、`update_application_status`

---

## 环境配置

### 前提条件

- Node.js 18+
- Java 17
- Maven 3.8+
- MySQL 8

### 1. 前端环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 2. 后端配置

`application.yml` 通过环境变量或 profile 文件注入敏感值。

**方式一（推荐）：使用 profile 文件**

```bash
cd job-tracker-backend/src/main/resources
cp application-example.yml application-prod.yml
```

编辑 `application-prod.yml`，填入以下内容：

```yaml
spring:
  datasource:
    username: 你的MySQL用户名
    password: 你的MySQL密码

jwt:
  secret: 随机64位字符串（可用 openssl rand -hex 32 生成）

deepseek:
  api-key: 你的DeepSeek API Key   # https://platform.deepseek.com

file:
  upload-dir: ./uploads/resumes   # 简历存储路径，按需修改
```

**方式二：使用环境变量**

```bash
export DB_USERNAME=root
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret
export DEEPSEEK_API_KEY=sk-xxxxxxxx
```

### 3. 数据库初始化

```sql
CREATE DATABASE job_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

表结构由 Spring Boot 启动时自动创建（`ddl-auto: update`），无需手动建表。

---

## 启动

### 启动后端

```bash
cd job-tracker-backend

# 使用 prod profile（读取 application-prod.yml）
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 或使用环境变量（不创建 prod 文件时）
DB_PASSWORD=xxx JWT_SECRET=xxx DEEPSEEK_API_KEY=xxx mvn spring-boot:run
```

服务启动在 `http://localhost:8080`，看到 `Started JobTrackerApplication` 即成功。

### 启动前端

```bash
# 项目根目录
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

---

## 主要功能

| 模块 | 功能 |
|------|------|
| Dashboard | 今日日程、投递统计、状态分布图 |
| 投递管理 | 按公司分组、17 种状态流转、面试/笔试/测评日程 |
| 公司管理 | 标签筛选、招聘链接、备注 |
| Offer 管理 | 汇总 Offer、填写薪资福利详情 |
| 简历管理 | 上传 PDF/DOC、在线预览、下载 |
| AI 助手 | 自然语言查询投递数据、添加日程、更新状态 |
| 账户设置 | 修改密码、注销账户 |

---

## 部署

### 前端

连接 GitHub 仓库至 [Vercel](https://vercel.com)，在项目设置中添加环境变量：

```
NEXT_PUBLIC_API_URL = https://你的后端域名
```

push 到 `main` 分支自动触发部署。

### 后端

使用 GitHub Actions（`.github/workflows/deploy-backend.yml`）自动部署至服务器。

需在 GitHub 仓库的 **Settings → Secrets → Actions** 中配置：

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器公网 IP |
| `SERVER_USER` | SSH 用户名（如 `root`） |
| `SERVER_SSH_KEY` | SSH 私钥内容 |

服务器需提前完成环境配置，详见 [服务器部署说明](#后端-1)。
