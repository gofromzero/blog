# blog

博客前台与后台静态原型。前台占用根路径，提供访客浏览、筛选、阅读和归档访问；后台放在 `admin/` 目录中，保持访客主流程与管理入口分离。

## 前台启动

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:4173
```

如需更换端口：

```bash
PORT=3000 npm run dev
```

Windows PowerShell：

```powershell
$env:PORT=3000; npm run dev
```

## 前台页面

- `/` 首页：站点概览、精选阅读、最近更新。
- `/posts` 文章列表：支持关键词搜索、分类筛选、标签筛选。
- `/post/frontend-architecture` 文章详情：正文、标签跳转、相关推荐。
- `/categories` 分类与标签：分类入口、标签云、标签文章列表。
- `/archives` 归档：按年份聚合内容。
- `/about` 关于我：作者介绍和内容方向。
- 其他路径：进入 404 页面，可返回首页或文章列表。

## 后台启动

方式一：直接打开文件

```bash
admin/index.html
```

方式二：使用本地静态服务

```bash
python -m http.server 5173
```

访问：

```text
http://localhost:5173/admin/
```

## 后台账号

当前为 mock 登录，不请求真实接口。

```text
Email: admin@example.com
Password: admin123
```

## 已实现后台路径

- `#/login`：登录页
- `#/dashboard`：运营看板
- `#/posts`：文章管理，支持搜索、分类筛选、状态筛选和新建/编辑入口
- `#/posts/new`：新建文章
- `#/posts/edit/:id`：编辑文章
- `#/categories`：分类管理，支持新增、编辑、状态切换
- `#/tags`：标签管理，支持新增、删除和颜色选择
- `#/about`：关于我配置，支持头像、简介、社交链接编辑
- `#/settings`：站点设置，支持站点信息、SEO、评论、维护模式等配置

## Mock 与后续 API 接入

- 前台内容来自 `src/content.js` 的 mock 数据，字段包含 `id`、`title`、`excerpt`、`category`、`tags`、`date`、`readTime`、`featured`、`cover`、`body`。
- 后台状态保存在 `localStorage` 的 `blog-admin-state-v1` 中。
- 后台 API 接入点集中预留在 `admin/app.js` 顶部的 `api` 对象中，后续可替换为真实 `fetch` 请求。
- 当前保存、发布、归档、开关状态等操作均更新本地状态并给出界面反馈。

## 验收关注

- 前台核心路由可通过 `npm run dev` 访问，支持直接打开 `/posts`、`/post/...` 等 history 路径。
- 后台独立入口为 `admin/index.html`，不占用根路径。
- 桌面端和移动端均提供可操作导航、筛选和阅读路径。
