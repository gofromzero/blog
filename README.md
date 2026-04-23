# blog

一个无第三方依赖的博客前台原型，覆盖首页、文章列表、文章详情、分类/标签、归档、关于我和 404 页面。

## 启动

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

## 数据说明

当前内容来自 `src/content.js` 的 mock 数据，字段包含 `id`、`title`、`excerpt`、`category`、`tags`、`date`、`readTime`、`featured`、`cover`、`body`。后续接入真实接口时可保持该结构作为前台消费契约。
