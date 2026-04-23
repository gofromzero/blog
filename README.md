# blog

静态 Blog 后台管理界面原型，当前实现重点是后台管理路径、信息架构和可操作控件状态。仓库暂未包含前台页面，后台全部放在 `admin/` 目录中，与未来前台根路径保持分离。

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

- 后台状态保存在 `localStorage` 的 `blog-admin-state-v1` 中。
- API 接入点集中预留在 `admin/app.js` 顶部的 `api` 对象中，后续可替换为真实 `fetch` 请求。
- 当前保存、发布、归档、开关状态等操作均更新本地状态并给出界面反馈。

## 验收关注

- 后台独立入口为 `admin/index.html`，不占用根路径。
- 桌面端使用侧边导航和内容工作区，移动端导航自动收敛为横向滚动，不阻断查看和编辑路径。
- 所有核心页面均可通过侧边栏或页面按钮进入，表单控件、筛选、保存、取消、返回和状态切换均可操作。
