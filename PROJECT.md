# Job Tracker 求职追踪系统

## 项目简介

Job Tracker 是一个面向中国求职者的全流程求职管理平台。用户可以追踪投递进度、管理目标公司、记录面试安排、管理 Offer，并通过内置 AI 助手以自然语言查询和操作求职数据。

---

## 技术栈

### 前端

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16（App Router，React 19） |
| 语言 | TypeScript 5（strict 模式） |
| 样式 | Tailwind CSS 4 + PostCSS |
| UI 组件 | shadcn/ui（Base UI React） |
| 图表 | Recharts 3 |
| 图标 | Lucide React |
| 日期处理 | date-fns 4（zhCN 语言包） |
| 通知 | sonner（Toast） |

### 后端

| 类别 | 技术 |
|------|------|
| 框架 | Spring Boot 3.3.5 |
| 语言 | Java 17 |
| 构建工具 | Maven |
| 主数据库 | MySQL（Spring Data JPA / Hibernate） |
| 会话数据库 | MongoDB（聊天历史） |
| 认证 | JWT（jjwt 0.12.6）+ Spring Security |
| 密码加密 | BCrypt（强度 12） |
| HTTP 客户端 | OkHttp 4.12.0 |
| AI 集成 | Anthropic Claude API（claude-haiku-4-5） |

---

## 项目架构

### 目录结构

```
job-tracker/
├── src/                                        # 前端（Next.js）
│   ├── app/
│   │   ├── (auth)/                            # 公开路由组
│   │   │   ├── login/page.tsx                 # 登录页
│   │   │   └── register/page.tsx              # 注册页
│   │   ├── (app)/                             # 受保护路由组
│   │   │   ├── layout.tsx                     # 含 token 守卫 + Sidebar
│   │   │   ├── page.tsx                       # Dashboard（今日概览）
│   │   │   ├── applications/page.tsx          # 投递管理
│   │   │   ├── companies/page.tsx             # 公司管理
│   │   │   ├── offers/page.tsx                # Offer 管理
│   │   │   ├── resumes/page.tsx               # 简历管理
│   │   │   ├── chat/page.tsx                  # AI 助手
│   │   │   └── account/page.tsx               # 账户设置
│   │   ├── layout.tsx                         # 根布局（字体、Toaster）
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                                # shadcn/ui 基础组件
│   │   ├── Sidebar.tsx                        # 导航侧边栏
│   │   └── CycleSelector.tsx                  # 求职批次选择器
│   └── lib/
│       ├── api.ts                             # API 客户端（token 管理）
│       ├── constants.ts                       # 状态常量与颜色映射
│       └── utils.ts                           # 工具函数
├── job-tracker-backend/                        # 后端（Spring Boot）
│   └── src/main/java/com/jobtracker/
│       ├── JobTrackerApplication.java         # 启动入口
│       ├── config/
│       │   ├── SecurityConfig.java            # JWT + CORS + 会话配置
│       │   └── AppConfig.java                 # OkHttp / ObjectMapper Bean
│       ├── security/
│       │   ├── JwtUtil.java                   # JWT 生成与解析
│       │   ├── JwtAuthFilter.java             # JWT 请求过滤器
│       │   └── AuthUser.java                  # 认证主体对象
│       ├── controller/                        # REST 控制器
│       │   ├── AuthController.java
│       │   ├── DashboardController.java
│       │   ├── ApplicationController.java
│       │   ├── EventController.java
│       │   ├── CompanyController.java
│       │   ├── OfferController.java
│       │   ├── ResumeController.java
│       │   ├── CycleController.java
│       │   ├── ChatController.java
│       │   └── AccountController.java
│       ├── service/                           # 业务逻辑层
│       ├── entity/
│       │   ├── mysql/                         # JPA 实体（User, Application…）
│       │   └── mongo/                         # MongoDB 文档（ChatMessage）
│       ├── repository/
│       │   ├── mysql/                         # JPA Repository
│       │   └── mongo/                         # MongoDB Repository
│       └── dto/request/                       # 请求 DTO
│   └── src/main/resources/
│       └── application.yml                    # 数据库、JWT、AI 配置
├── uploads/                                    # 简历文件存储
├── package.json                               # 前端依赖
├── .env.local                                 # 前端环境变量
└── PROJECT.md
```

### 前端路由层级

```
Root Layout（Geist 字体 + Toaster）
├── (auth) Layout — 居中渐变背景，无需登录
│   ├── /login
│   └── /register
└── (app) Layout — token 守卫 + Sidebar
    ├── /                 Dashboard
    ├── /applications     投递管理
    ├── /companies        公司管理
    ├── /offers           Offer 管理
    ├── /resumes          简历管理
    ├── /chat             AI 助手
    └── /account          账户设置
```

### 后端分层架构

```
HTTP 请求
  → JwtAuthFilter（提取并验证 JWT，写入 SecurityContext）
  → Controller（路由映射、参数绑定、校验）
  → Service（业务逻辑、事务管理）
  → Repository（JPA / MongoDB 数据访问）
  → MySQL / MongoDB
```

### 全局数据流

```
用户操作
  → React 组件（useState / useEffect）
  → lib/api.ts apiFetch（自动附加 Authorization: Bearer <token>）
  → Spring Boot API（:8080）
  → Service 处理 → 数据库读写
  → JSON 响应 → 更新 React State → 重新渲染
  → 若返回 401 → 清除 localStorage → 跳转 /login
```

---

## 数据模型

### MySQL 实体（JPA）

**User（用户）**
- `id`（UUID）、`username`（唯一）、`passwordHash`（BCrypt）、`role`（user / admin）、`createdAt`

**JobCycle（求职批次）**
- `id`、`userId`、`name`、`isActive`、`startDate`、`endDate`、`createdAt`

**Company（公司）**
- `id`、`name`（唯一）、`tags`（JSON 数组）、`recruitmentUrl`、`notes`、`createdAt`、`updatedAt`

**Application（投递记录）**
- `id`、`userId`、`companyId`、`cycleId`、`positionName`、`jdLink`、`base`（工作地点）、`status`、`failReason`、`appliedAt`、`notes`、`updatedAt`
- 关联：多对一 → Company

**Event（日程事件）**
- `id`、`applicationId`、`type`（interview / written_test / assessment）、`scheduledAt`、`link`、`notes`、`createdAt`

**Offer**
- `id`、`applicationId`（唯一）、`department`、`base`、`salary`、`benefits`、`updatedAt`

**Resume（简历）**
- `id`、`userId`、`name`、`filename`、`filePath`、`mimeType`、`size`、`createdAt`

### MongoDB 文档

**ChatMessage（对话历史）**
- `id`、`userId`、`role`（user / assistant）、`content`、`createdAt`

### 投递状态流转（17 个状态）

```
已投递 → 待测评 → 已测评 → 待笔试 → 已笔试
       → 待AI面试 → 已AI面试
       → 待一面 → 已一面 → 待二面 → 已二面
       → 待三面 → 已三面 → 待HR面 → 已HR面
       → offer → 三方签约
```

**状态颜色规范（`lib/constants.ts` 统一管理）：**
- 绿色：`offer`、`三方签约`
- 灰色：`已投递`
- 琥珀色：所有「待」系列（待测评、待笔试…）
- 蓝色：所有「已」系列（已测评、已笔试…）

---

## 认证与安全

**JWT 认证流程：**
1. 用户登录 → 后端签发 JWT（含 `userId`、`username`、`role`，有效期 7 天）
2. 前端将 token 存入 `localStorage`
3. 所有请求通过 `apiFetch` 自动附加 `Authorization: Bearer <token>`
4. `JwtAuthFilter` 拦截请求，解析 token 并写入 `SecurityContext`
5. 401 响应触发前端自动登出并跳转 `/login`

**Spring Security 配置：**
- CORS：允许 `http://localhost:3000` 和 `http://127.0.0.1:3000`
- CSRF：禁用（无状态 JWT 架构）
- Session：STATELESS
- 公开端点：`/api/auth/**`，其余均需认证

---

## AI 助手架构

**调用链：**
```
用户消息
  → ChatController → ChatService
  → 构建含历史记录的消息列表
  → 调用 Anthropic Claude API（claude-haiku-4-5）
  → 模型返回工具调用（tool_use）→ 执行对应工具
  → 将工具结果追加到消息列表
  → 循环直到模型返回最终文本（end_turn）
  → 保存用户消息 + 助手回复至 MongoDB
  → 返回最终回复
```

**可用工具（Tool Use）：**

| 工具名 | 功能 |
|--------|------|
| `get_today_schedule` | 获取今日面试 / 笔试 / 测评日程 |
| `get_applications_summary` | 获取投递数量统计与各状态分布 |
| `add_event` | 为指定投递添加日程事件 |
| `update_application_status` | 更新投递状态（需用户确认） |

---

## 已实现功能

### 1. 认证系统
- 账号注册（用户名 ≥ 2 字符、密码 ≥ 4 字符，含确认密码校验）
- 账号登录，JWT 存入 `localStorage`
- 受保护路由自动检测 token，缺失则跳转 `/login`
- 401 响应自动清除 token 并跳转

### 2. Dashboard（今日概览）
- 今日日程列表：展示当天面试、笔试、测评，含时间和链接
- 数据统计卡片：总投递数及各状态数量
- 状态分布甜甜圈图（Recharts）
- 按求职批次（Cycle）筛选全部数据

### 3. 投递管理（Applications）
- 以公司为单位分组展示，可展开/收起查看详情
- 每条投递：职位名、工作地点、JD 链接、状态徽章、投递时间、备注
- 状态下拉更新（覆盖完整 17 状态流转）
- 面试/笔试/测评日程增删（含时间、链接、备注）
- 投递备注实时编辑
- 删除投递记录
- 求职批次创建与切换
- 快速跳转主流招聘平台（BOSS直聘、牛客、应届生等）

### 4. 公司管理（Companies）
- 公司信息增删改查（名称、招聘链接、标签、备注）
- 预设标签：国企、银行、外企、互联网、金融、央企、民企、事业单位
- 按名称搜索，按标签筛选
- 快速跳转公司招聘页

### 5. Offer 管理（Offers）
- 汇总所有状态为 `offer` 的投递
- Offer 详情编辑：部门、工作地点、薪资、福利
- 未填写项显示「待填写」徽章

### 6. 简历管理（Resumes）
- 上传简历（PDF / DOC / DOCX，最大 10MB），文件存储于 `uploads/resumes`
- 简历列表：文件名、类型、大小、上传时间
- 在线预览（PDF 内联，DOC 提示下载）、下载、删除
- 集成 WonderCV 简历编辑器外链

### 7. AI 助手（Chat）
- 自然语言查询和操作求职数据
- 对话历史持久化至 MongoDB，刷新后保留
- 快捷提示词一键发送
- 自动滚动至最新消息，清空历史功能

### 8. 账户设置（Account）
- 展示用户名、角色、注册时间
- 修改密码（需验证旧密码）
- 注销账户（需输入用户名二次确认，不可逆）

---

## API 接口一览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 认证 | POST | `/api/auth/register` | 注册 |
| 认证 | POST | `/api/auth/login` | 登录（返回 JWT） |
| Dashboard | GET | `/api/dashboard` | 今日概览（`?cycleId=` 可选筛选） |
| 投递 | GET | `/api/applications` | 获取投递列表（`?cycleId=` 可选） |
| 投递 | POST | `/api/applications` | 新增投递 |
| 投递 | PUT | `/api/applications/{id}` | 更新投递 |
| 投递 | DELETE | `/api/applications/{id}` | 删除投递 |
| 日程 | POST | `/api/events` | 新增日程事件 |
| 日程 | PUT | `/api/events/{id}` | 更新日程事件 |
| 日程 | DELETE | `/api/events/{id}` | 删除日程事件 |
| 公司 | GET | `/api/companies` | 获取公司列表 |
| 公司 | POST | `/api/companies` | 新增公司 |
| 公司 | PUT | `/api/companies/{id}` | 更新公司 |
| 公司 | DELETE | `/api/companies/{id}` | 删除公司 |
| Offer | GET | `/api/offers` | 获取 Offer 列表 |
| Offer | PUT | `/api/offers/{applicationId}` | 新增或更新 Offer 详情 |
| 简历 | GET | `/api/resumes` | 获取简历列表 |
| 简历 | POST | `/api/resumes` | 上传简历（multipart/form-data） |
| 简历 | GET | `/api/resumes/{id}` | 下载简历文件 |
| 简历 | DELETE | `/api/resumes/{id}` | 删除简历 |
| 批次 | GET | `/api/cycles` | 获取批次列表 |
| 批次 | POST | `/api/cycles` | 新建批次 |
| 批次 | PUT | `/api/cycles/{id}` | 更新批次 |
| 批次 | DELETE | `/api/cycles/{id}` | 删除批次 |
| AI 助手 | GET | `/api/chat` | 获取对话历史 |
| AI 助手 | POST | `/api/chat` | 发送消息（触发 Agent 循环） |
| AI 助手 | DELETE | `/api/chat` | 清空对话历史 |
| 账户 | GET | `/api/account` | 获取用户信息 |
| 账户 | PUT | `/api/account` | 修改密码 |
| 账户 | DELETE | `/api/account` | 注销账户 |

---

## 环境配置

**前端 `.env.local`：**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**后端 `application.yml`（关键配置项）：**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/job_tracker
  data:
    mongodb:
      uri: mongodb://localhost:27017/job_tracker

jwt:
  secret: <your-secret>
  expiration: 604800000   # 7 天

anthropic:
  api-key: <your-key>
  model: claude-haiku-4-5-20251001

file:
  upload-dir: ./uploads/resumes
```

---

## 本地开发

### 启动后端

```bash
cd job-tracker-backend
mvn spring-boot:run
# 服务监听 http://localhost:8080
```

前提：本地已启动 MySQL（数据库 `job_tracker`）和 MongoDB。

### 启动前端

```bash
# 项目根目录
npm install
npm run dev
# 服务监听 http://localhost:3000
```

---

## 关键设计决策

- **路由组隔离**：`(auth)` 和 `(app)` 两个路由组各自拥有独立 `layout.tsx`，认证守卫集中在 `(app)/layout.tsx`，避免各页面重复处理。
- **统一 API 客户端**：`lib/api.ts` 的 `apiFetch` 统一注入 token 并处理 401 自动登出，不散落在各页面组件中。
- **双数据库分离**：结构化业务数据（投递、公司、Offer 等）存 MySQL，非结构化的对话历史存 MongoDB，各取所长。
- **Agent 循环**：AI 助手采用 tool_use 循环而非单次调用，支持多步骤复合操作（如先查数据再执行更新）。
- **批次（Cycle）设计**：支持秋招 / 春招多轮求职，`CycleSelector` 在全局层切换，数据视图随批次隔离，互不干扰。
- **状态常量集中管理**：`lib/constants.ts` 统一定义 17 个投递状态及颜色映射，UI 与业务逻辑解耦，改动一处全局生效。

云端访问：

- 单独开一个terminal：cloudflared tunnel --url http://localhost:3000
- 输入生成的url即可所有人访问
