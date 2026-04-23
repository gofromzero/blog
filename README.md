# Blog

博客项目采用前后端分离的重构方向。当前仓库同时包含可运行的前台/后台静态 demo、工程治理文档、后端预留目录和后续 API 接入边界。

## Repository Layout

```text
apps/
  frontend/        Public blog frontend application placeholder.
  admin/           Admin console application placeholder.
admin/             Current admin static demo.
src/               Current public blog static demo source.
services/
  backend/         Backend service placeholder and future API structure.
docs/
  architecture.md  Repository architecture and ownership boundaries.
  git-workflow.md  Branch, commit, and review conventions.
```

## Development Boundaries

- `src` and root `index.html` hold the current public blog demo.
- `admin` holds the current admin console demo.
- `apps/frontend` is reserved for the future standalone frontend app.
- `apps/admin` is reserved for the future standalone admin app.
- `services/backend` is reserved for API, persistence, and backend jobs.
- Cross-cutting conventions live in `docs`.

## Frontend Dev Server

```bash
npm run dev
```

Default URL:

```text
http://localhost:4173
```

Use another port:

```bash
PORT=3000 npm run dev
```

Windows PowerShell:

```powershell
$env:PORT=3000; npm run dev
```

## Public Pages

- `/` 首页：站点概览、精选阅读、最近更新。
- `/posts` 文章列表：支持关键词搜索、分类筛选、标签筛选。
- `/post/frontend-architecture` 文章详情：正文、标签跳转、相关推荐。
- `/categories` 分类与标签：分类入口、标签云、标签文章列表。
- `/archives` 归档：按年份聚合内容。
- `/about` 关于我：作者介绍和内容方向。
- 其他路径：进入 404 页面，可返回首页或文章列表。

## Admin Pages

方式一：复用本地静态服务

```bash
npm run dev
```

访问：

```text
http://localhost:4173/admin/
```

方式二：直接打开文件

```bash
admin/index.html
```

方式三：使用其他静态服务

```bash
python -m http.server 5173
```

访问：

```text
http://localhost:5173/admin/
```

Mock account:

```text
Email: admin@example.com
Password: admin123
```

Implemented routes:

- `#/login`：登录页
- `#/dashboard`：运营看板
- `#/posts`：文章管理，支持搜索、分类筛选、状态筛选和新建/编辑入口
- `#/posts/new`：新建文章
- `#/posts/edit/:id`：编辑文章
- `#/categories`：分类管理，支持新增、编辑、状态切换
- `#/tags`：标签管理，支持新增、删除和颜色选择
- `#/about`：关于我配置，支持头像、简介、社交链接编辑
- `#/settings`：站点设置，支持站点信息、SEO、评论、维护模式等配置

## Mock And API Migration

- 前台内容来自 `src/content.js` 的 mock 数据，字段包含 `id`、`title`、`excerpt`、`category`、`tags`、`date`、`readTime`、`featured`、`cover`、`body`。
- 后台状态保存在 `localStorage` 的 `blog-admin-state-v1` 中。
- 后台 API 接入点集中预留在 `admin/app.js` 顶部的 `api` 对象中，后续可替换为真实 `fetch` 请求。
- 后续真实后端服务和 API 契约放在 `services/backend`。

## Git Workflow

Use feature branches instead of committing directly to `master`.

Recommended branch format:

```text
agent/<role-or-owner>/<short-task-id>
feature/<scope>/<short-description>
fix/<scope>/<short-description>
```

Recommended commit format:

```text
[type][agent] subject
```

Examples:

```text
[chore][dev] initialize blog repository skeleton
[fix][frontend] serve admin demo from dev server
```

See [docs/git-workflow.md](docs/git-workflow.md) for details.

## Verification

- Public routes can be opened through `npm run dev`, including direct history paths such as `/posts` and `/post/...`.
- Admin routes are isolated under `/admin/` or `admin/index.html`.
- Desktop and mobile layouts should keep navigation, filtering, reading, and editing flows usable.
