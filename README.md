# Job Tracker · 求职追踪系统

面向求职者的全流程管理平台。追踪投递进度、管理目标公司、记录面试安排、管理 Offer，并通过内置 AI 助手以自然语言查询和操作求职数据。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite 8、React 19、TypeScript、React Router 7、Tailwind CSS 4、shadcn/ui |
| 后端 | Spring Boot 3.3.5、Java 17、Maven |
| 数据库 | MySQL 8 |
| 认证 | JWT（jjwt 0.12.6）+ Spring Security |
| AI 助手 | DeepSeek API（function calling） |
| 文件存储 | 本地文件系统 |

前端为纯静态 SPA，不依赖 Node 服务端渲染，构建产物可直接托管在任意静态服务器。

---

## 项目结构

```
job-tracker/
├── index.html                      # Vite 入口 HTML
├── vite.config.ts                  # Vite 配置（含 /api 开发代理）
├── src/                            # 前端（React SPA）
│   ├── main.tsx                    # 应用入口（挂载 Router + Toaster）
│   ├── routes.tsx                  # 路由表
│   ├── app/
│   │   ├── globals.css             # Tailwind 主题与全局样式
│   │   ├── (auth)/                 # 登录 / 注册（无需鉴权）
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── (app)/                  # 主应用（需登录）
│   │       ├── layout.tsx          # Token 守卫 + Sidebar + Outlet
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
│   │   ├── CycleSelector.tsx
│   │   ├── StatusPipeline.tsx      # 投递状态流水线
│   │   └── MessageContent.tsx      # AI 回复的 Markdown 渲染
│   └── lib/
│       ├── api.ts                  # 统一请求客户端（自动注入 JWT）
│       ├── constants.ts            # 投递状态常量与颜色映射
│       └── utils.ts
│
├── public/                         # 静态资源（favicon 等）
│
├── job-tracker-backend/            # 后端（Spring Boot）
│   └── src/main/
│       ├── java/com/jobtracker/
│       │   ├── config/             # Security、CORS、Bean 配置
│       │   ├── controller/         # REST 接口层（10 个控制器）
│       │   ├── service/            # 业务逻辑层
│       │   ├── entity/mysql/       # JPA 实体
│       │   ├── repository/mysql/   # JPA Repository
│       │   ├── security/           # JWT 过滤器与工具类
│       │   └── dto/request/        # 请求 DTO
│       └── resources/
│           ├── application.yml         # 主配置（含占位符，可提交 git）
│           ├── application-prod.yml    # 生产配置（含真实密钥，已 gitignore）
│           └── application-example.yml # 配置模板，照此创建 prod 文件
│
└── uploads/                        # 简历文件存储（已 gitignore）
```

---

## 架构说明

### 请求链路

```
浏览器
  → Vite 静态资源（:3000，开发环境由 Vite dev server 提供）
  → lib/api.ts apiFetch（自动附加 Authorization: Bearer <token>）
  → Vite dev proxy 转发 /api/* → Spring Boot（:8080）
  → JwtAuthFilter 验证 token
  → Controller → Service → MySQL
  → JSON 响应 → 更新 React State
  → 若 401 → 清除 token → 跳转 /login
```

开发环境下前端与后端通过 Vite 的 `server.proxy` 打通，浏览器只需访问 `:3000`。
生产环境前端为静态文件，需由 Nginx 等反向代理把 `/api/*` 转发到后端，或通过 `VITE_API_URL` 指定后端地址。

### 认证流程

1. 用户登录 → 后端签发 JWT（有效期 7 天）
2. 前端将 token 存入 `localStorage`
3. 所有请求由 `apiFetch` 自动附加 `Authorization` 头
4. `JwtAuthFilter` 拦截并验证，写入 `SecurityContext`
5. 未认证请求由 `AuthenticationEntryPoint` 统一返回 **401**，前端据此清理 token 并跳转登录页

### AI 助手

DeepSeek function calling 循环，支持多步操作：

```
用户消息 → ChatService → 构建历史消息列表（含活跃周期上下文）→ 调用 DeepSeek API
  → 若返回 tool_calls → 执行对应工具（查询/更新数据库）→ 追加结果 → 再次调用
  → 直到返回最终文本 → 保存至 MySQL → 返回前端
```

可用工具：

| 工具 | 说明 |
|------|------|
| `get_cycles` | 查询所有求职周期（名称 + ID），用于把「2027秋招」这类自然语言转为 ID |
| `get_today_schedule` | 查询今日面试 / 笔试 / 测评安排 |
| `get_applications_summary` | 投递数量按状态汇总 |
| `get_applications_detail` | 投递明细（公司、岗位、状态、挂在节点），供分析类问题使用 |
| `add_event` | 为某个投递记录添加面试 / 笔试 / 测评安排 |
| `update_application_status` | 更新投递状态（需二次确认） |

---

## 环境配置

### 前提条件

- Node.js 18+
- Java 17
- Maven 3.8+
- MySQL 8

### 1. 前端环境变量

开发环境无需配置——`vite.config.ts` 已把 `/api` 代理到 `http://localhost:8080`。

生产构建时如需直连后端域名，在项目根目录创建 `.env`：

```bash
VITE_API_URL=https://你的后端域名
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

# 使用 local / prod profile（读取对应的 application-*.yml）
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

### 构建前端

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览构建产物
```

---

## 主要功能

| 模块 | 功能 |
|------|------|
| Dashboard | 今日日程、投递统计卡片（悬浮 / 点击查看明细）、状态分布环形图 |
| 投递管理 | 按公司分组、支持「全部 / 进行中 / 已挂」筛选、18 种状态流转、面试 / 笔试 / 测评日程、挂在节点记录 |
| 公司管理 | 标签筛选、招聘链接、备注 |
| Offer 管理 | 汇总 Offer、填写部门 / Base / 薪资 / 福利详情 |
| 简历管理 | 上传 PDF / DOC、在线预览、下载 |
| AI 助手 | 自然语言查询投递数据、分析求职进度、添加日程、更新状态 |
| 账户设置 | 修改密码、注销账户 |

---

## 部署

### 前端

```bash
npm run build
```

将 `dist/` 目录部署到任意静态托管（Nginx、Vercel、Netlify、对象存储均可）。

若使用 Nginx，需配置 history fallback 与 API 反向代理：

```nginx
location / {
    root /path/to/dist;
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 后端

```bash
cd job-tracker-backend
mvn clean package -DskipTests
java -jar target/job-tracker-backend-*.jar --spring.profiles.active=prod
```

建议配合 systemd 管理进程。仓库本地保留了 `.github/workflows/deploy-backend.yml`（未提交），如需自动部署可将其纳入版本控制，并在 GitHub 仓库 **Settings → Secrets → Actions** 配置：

| Secret | 说明 |
|--------|------|
| `SERVER_HOST` | 服务器公网 IP |
| `SERVER_USER` | SSH 用户名（如 `root`） |
| `SERVER_SSH_KEY` | SSH 私钥内容 |
