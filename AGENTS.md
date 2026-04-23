# AGENTS.md — From Zero Blog

本文件包含 AI 编码助手在操作本仓库前需要了解的全部信息。本项目是一个名为 **"From Zero Blog"** 的轻量级个人博客 monorepo。

---

## 项目概述

本仓库采用前后端分离架构，目前包含以下内容：

- 一个可运行的**公开博客静态演示** (`src/`, `index.html`) —— 基于原生 JavaScript 的 SPA，通过后端 API 获取数据。
- 一个可运行的**管理后台静态演示** (`admin/`) —— 基于原生 JavaScript 的 SPA，使用 hash 路由和 `localStorage` 模拟数据持久化。
- 一个已完整实现的 **Go 后端** (`services/backend/`)，提供 REST API、JWT 认证和 SQLite 持久化。
- **预留目录** (`apps/frontend`, `apps/admin`, `apps/web`)，用于未来的独立应用。

前端演示有意保持无构建步骤。后端采用经典分层架构。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 公开博客演示 | Vanilla JavaScript (ES modules), Vanilla CSS, HTML5, 自定义客户端路由 |
| 管理后台演示 | Vanilla JavaScript (IIFE), Vanilla CSS, HTML5, hash 路由 |
| 开发服务器 | 基于 Node.js `http` 的自定义静态文件服务器 (`server.js`) |
| 后端 | Go 1.25.1, Gin, GORM, SQLite (`mattn/go-sqlite3`), JWT (`golang-jwt/jwt/v5`), bcrypt, godotenv |
| 未来前端（预留） | Astro（`apps/web/` 中已有初始骨架） |
| 未来后台（预留） | React + Vite（`apps/admin/` 中已有初始骨架） |

---

## 仓库目录结构

```text
.
├── index.html              # 公开博客入口
├── server.js               # Node.js 静态开发服务器
├── package.json            # 根目录 npm 配置（无依赖）
├── src/                    # 当前公开博客演示
│   ├── app.js              # SPA 路由、API 客户端、主题切换、Markdown 渲染
│   ├── content.js          # 遗留模拟数据（已废弃；应用现已调用后端）
│   └── styles.css          # 带暗黑/亮色主题的设计系统 CSS
├── admin/                  # 当前管理后台演示
│   ├── index.html
│   ├── app.js              # hash 路由管理后台 SPA（约 700 行）
│   └── styles.css
├── apps/
│   ├── frontend/           # 预留：未来独立公开应用
│   ├── admin/              # 预留：未来独立管理后台应用
│   └── web/                # 预留：未来基于 Astro 的应用
├── services/
│   └── backend/            # Go 后端服务
│       ├── cmd/server/main.go
│       ├── configs/
│       │   ├── .env        # 运行时密钥（git 忽略）
│       │   └── .env.example
│       ├── internal/
│       │   ├── config/     # 基于环境变量的配置加载器
│       │   ├── handler/    # HTTP 处理器（公开 API + 管理 API + RSS）
│       │   ├── middleware/ # JWT Bearer Token 校验
│       │   ├── model/      # GORM 模型
│       │   ├── repository/ # 数据访问层（GORM 查询）
│       │   └── service/    # 业务逻辑 + 认证（JWT/bcrypt）
│       ├── api/contracts.md# API 契约文档
│       ├── migrations/     # 空（使用 GORM 自动迁移）
│       └── scripts/        # 空
└── docs/
    ├── architecture.md     # Monorepo 布局说明
    └── git-workflow.md     # 分支、提交和审查规范
```

**重要边界：**
- `src/` 和根目录 `index.html` = 当前公开博客演示。
- `admin/` = 当前管理后台演示。
- `apps/*` = 预留用于未来独立应用；不要将当前演示代码放在此处。
- `services/backend` = 仅后端实现。
- `docs/` = 项目级治理文档。

---

## 构建和运行命令

### 前端（静态演示）

```bash
# 启动静态开发服务器（默认端口 4173）
npm run dev

# 或显式运行
node server.js

# 自定义端口（Unix）
PORT=3000 npm run dev

# 自定义端口（Windows PowerShell）
$env:PORT=3000; npm run dev
```

服务器支持 SPA 回退：未知路径返回 `index.html`。

访问地址：
- 公开博客：`http://localhost:4173`
- 管理后台：`http://localhost:4173/admin/`

### 后端

```bash
cd services/backend

# 运行
go run ./cmd/server

# 构建
go build -o server.exe ./cmd/server
```

默认后端地址：`http://localhost:8080`

后端在启动时自动迁移 SQLite 表结构，并在数据库为空时填充示例数据。默认管理员凭据：
- 邮箱：`admin@blog.local`
- 密码：`admin123`

### 环境配置

将 `services/backend/configs/.env.example` 复制为 `services/backend/configs/.env`，并填写实际值：

```text
APP_ENV=local
HTTP_ADDR=:8080
DATABASE_DSN=blog.db
JWT_SECRET=your-secret-here
```

> **注意：** 仓库中的 `.env.example` 里 `DATABASE_DSN=` 是留空的；创建本地 `.env` 时请将其设为 `blog.db`（或任意偏好的 SQLite 文件路径）。
>
> `JWT_SECRET` 在本地模式下会回退到 `default-secret`，但在**非本地环境必须显式设置**，否则服务器将拒绝启动。

---

## 代码风格规范

- **EditorConfig** 在根目录生效。关键规则：
  - 字符集：UTF-8
  - 换行符：LF
  - 缩进：`*` 使用 2 个空格，**`*.go` 使用 tab**
  - 去除行尾空格（`*.md` 除外）
- **Go**：遵循标准 Go 格式化（`gofmt`）。使用 tab 缩进。
- **JavaScript/CSS**：使用 2 空格缩进。未配置强制 linter。
- **注释**：中英文混用可接受；优先保证清晰。

---

## 测试说明

**本仓库目前没有自动化测试。**

- 没有 `*_test.go` 文件。
- 没有 JavaScript 测试框架（Jest、Vitest 等）。
- 没有 CI 流水线。

添加测试时：
- Go 测试应放在被测文件旁边（`handler_test.go` 与 `handler.go` 同级）。
- 前端测试请在对应的 `apps/*` 目录中引入测试运行器，而非根目录演示代码中。

---

## 安全注意事项

- **CORS**：后端 CORS 中间件允许 `*` 来源及所有方法和请求头。这在本地开发时很方便，但在**部署生产环境前必须加以限制**。
- **JWT Secret**：永远不要提交 `.env`。本地回退值 `default-secret` 在任何非本地环境中都不安全。
- **密码**：管理员密码使用 bcrypt 哈希。种子数据中的管理员密码为 `admin123`。
- **SQL 注入**：全程使用 GORM；除非必要，避免手写原生 SQL。
- **XSS**：前端演示在注入前会进行 HTML 转义（`escapeHtml` 辅助函数），但 Markdown 转换器比较基础。请勿信任用户生成的 HTML。

---

## 开发规范

### Git 工作流

不要直接向 `main` 分支提交代码。使用短生命周期的功能分支。

分支命名：
```text
agent/<agent-name>/<task-id>
feature/<scope>/<short-description>
fix/<scope>/<short-description>
chore/<scope>/<short-description>
```

提交格式：
```text
[type][agent] subject
```

类型：`feat`, `fix`, `chore`, `docs`, `refactor`, `test`。

示例：`[chore][dev] initialize repository skeleton`

详见 `docs/git-workflow.md`。

### API 契约

所有后端 API 的数据结构都记录在 `services/backend/api/contracts.md` 中。前端和管理后台应用必须依赖这些契约，而不是后端内部实现。

关键端点（数据结构详见 `services/backend/api/contracts.md`）：
- **公开端点：** `GET /api/posts`, `GET /api/posts/:slug`, `GET /api/categories`, `GET /api/tags`, `GET /api/site-settings`
- **公开端点（附加）：** `GET /api/archives`, `GET /api/search`, `GET /api/rss`, `GET /api/posts/:slug/comments`, `POST /api/posts/:slug/comments`
- **管理后台认证：** `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/auth/logout`
- **管理后台 CRUD：** 文章、分类、标签、站点设置
- **管理后台评论审核：** `GET /api/admin/comments`, `PUT /api/admin/comments/:id/approve`, `DELETE /api/admin/comments/:id`
- **管理后台统计：** `GET /api/admin/stats`

管理路由需要在 `Authorization` 请求头中携带 `Bearer` Token。

### 集成规则

- `internal/` 下的后端包**不与**前端应用共享。
- 前端和管理后台应用应通过小型数据访问层读取数据；不要从页面组件中直接调用模拟对象。
- 环境相关的值不要放入 Git；只提交示例文件（`.env.example`）。

---

## 给 Agent 的注意事项

- 根目录前端演示（`src/`, `admin/`）是**无构建步骤的静态文件**。不要在此处引入 Vite/Webpack/Astro 等构建工具；这些留给 `apps/*`。
- 后端已完全可用。`src/app.js` 已将 `API_BASE` 指向 `http://localhost:8080/api` 并发起真实的 `fetch` 调用。
- `src/content.js` 是遗留模拟数据。新开发应使用后端 API。
- `admin/app.js` 仍使用 `localStorage`（`blog-admin-state-v1`）。API 集成边界已在顶部 `api` 对象处预留标记；**尚未接入真实后端**。
- 修改 Go 代码时，如果依赖发生变化，记得运行 `go mod tidy`。
- **Git 卫生：** 根目录 `.gitignore` 目前未排除 `*.db` 和 `*.exe`。建议添加这些规则，防止本地 SQLite 数据库（`blog.db`）和 Go 构建产物（`server.exe`）被意外提交。
