(function () {
  "use strict";

  const storageKey = "blog-admin-state-v1";

  // Replace these methods with real fetch calls when the backend API is ready.
  const api = {
    load() {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : seedState();
    },
    save(nextState) {
      localStorage.setItem(storageKey, JSON.stringify(nextState));
      return nextState;
    }
  };

  const app = document.getElementById("app");
  let state = api.load();

  const routes = [
    { path: "dashboard", label: "Dashboard", icon: "□" },
    { path: "posts", label: "文章管理", icon: "≡" },
    { path: "categories", label: "分类管理", icon: "◇" },
    { path: "tags", label: "标签管理", icon: "#" },
    { path: "about", label: "关于我", icon: "◎" },
    { path: "settings", label: "站点设置", icon: "⚙" }
  ];

  const statusMap = {
    published: "已发布",
    draft: "草稿",
    archived: "已归档"
  };

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.hash = state.session.active ? "#/dashboard" : "#/login";
  }

  render();

  function seedState() {
    return {
      session: { active: false, user: "admin@example.com" },
      posts: [
        {
          id: 1,
          title: "从零搭建可维护的个人博客",
          slug: "build-maintainable-blog",
          category: "工程实践",
          tags: ["架构", "前端"],
          status: "published",
          excerpt: "记录博客从需求拆分、目录规划到发布流程的设计思考。",
          content: "这是一篇关于博客工程化实践的 mock 内容，后续可替换为真实接口返回的正文。",
          updatedAt: "2026-04-18"
        },
        {
          id: 2,
          title: "后台内容模型设计笔记",
          slug: "admin-content-model",
          category: "产品设计",
          tags: ["后台", "内容"],
          status: "draft",
          excerpt: "整理文章、分类、标签和站点配置之间的关系。",
          content: "草稿内容会保存在本地状态中，真实 API 接入后替换保存逻辑。",
          updatedAt: "2026-04-20"
        },
        {
          id: 3,
          title: "一次页面性能排查过程",
          slug: "performance-review",
          category: "工程实践",
          tags: ["性能"],
          status: "archived",
          excerpt: "从加载体积、渲染任务和资源缓存三个方向拆解问题。",
          content: "归档文章仍可编辑，但不会出现在默认发布列表。",
          updatedAt: "2026-03-29"
        }
      ],
      categories: [
        { id: 1, name: "工程实践", slug: "engineering", enabled: true, description: "技术方案、工程质量和性能优化" },
        { id: 2, name: "产品设计", slug: "product-design", enabled: true, description: "信息架构、交互流程和体验复盘" },
        { id: 3, name: "随笔", slug: "notes", enabled: false, description: "短内容和阶段记录" }
      ],
      tags: [
        { id: 1, name: "架构", color: "#1267d8" },
        { id: 2, name: "前端", color: "#12805c" },
        { id: 3, name: "后台", color: "#a15c00" },
        { id: 4, name: "性能", color: "#7c3aed" },
        { id: 5, name: "内容", color: "#b42318" }
      ],
      about: {
        name: "Zero",
        title: "独立开发者 / 技术写作者",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=320&q=80",
        bio: "关注产品工程、Web 架构和长期可维护的个人知识系统。",
        github: "https://github.com/gofromzero",
        email: "hello@example.com"
      },
      settings: {
        siteName: "From Zero Blog",
        domain: "https://blog.example.com",
        description: "记录工程实践、产品思考和个人成长。",
        seoTitle: "From Zero Blog - 工程实践与产品思考",
        seoKeywords: "blog, engineering, product",
        commentsEnabled: true,
        maintenanceMode: false,
        defaultStatus: "draft"
      },
      ui: {
        postSearch: "",
        postCategory: "all",
        postStatus: "all",
        editingCategoryId: null
      }
    };
  }

  function persist(message) {
    state = api.save(state);
    if (message) showToast(message);
  }

  function routeParts() {
    return location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  }

  function navigate(path) {
    location.hash = "#/" + path;
  }

  function render() {
    const parts = routeParts();
    const page = parts[0] || (state.session.active ? "dashboard" : "login");

    if (page !== "login" && !state.session.active) {
      navigate("login");
      return;
    }

    if (page === "login") {
      renderLogin();
      return;
    }

    app.innerHTML = layout(page, renderPage(page, parts));
    bindPage(page, parts);
  }

  function layout(active, content) {
    return `
      <div class="admin-shell">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand-mark">B</div>
            <div>
              <strong>Blog Admin</strong>
              <span>内容管理后台</span>
            </div>
          </div>
          <nav class="nav">
            ${routes.map((item) => `
              <a href="#/${item.path}" class="${active === item.path || (active === "posts" && item.path === "posts") ? "active" : ""}">
                <span class="icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>
            `).join("")}
          </nav>
          <div class="sidebar-footer">
            <span>当前账号：${escapeHtml(state.session.user)}</span>
            <button class="btn ghost" data-action="logout"><span class="icon">↩</span>退出登录</button>
          </div>
        </aside>
        <main class="content">${content}</main>
      </div>
    `;
  }

  function pageHeader(title, subtitle, actions) {
    return `
      <div class="topbar">
        <div class="page-title">
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        <div class="actions">${actions || ""}</div>
      </div>
    `;
  }

  function renderPage(page, parts) {
    if (page === "dashboard") return dashboardPage();
    if (page === "posts" && parts[1] === "new") return postEditorPage();
    if (page === "posts" && parts[1] === "edit") return postEditorPage(Number(parts[2]));
    if (page === "posts") return postsPage();
    if (page === "categories") return categoriesPage();
    if (page === "tags") return tagsPage();
    if (page === "about") return aboutPage();
    if (page === "settings") return settingsPage();
    return notFoundPage();
  }

  function renderLogin() {
    app.innerHTML = `
      <div class="login-shell">
        <section class="login-hero">
          <h1>Blog Admin</h1>
          <p>独立后台入口，用于管理文章、分类、标签、关于我和站点配置。当前使用 mock 数据演示完整操作路径。</p>
        </section>
        <section class="login-panel">
          <form class="login-form" data-form="login">
            <h2>登录后台</h2>
            <p class="hint">使用 README 中的 mock 账号进入管理界面。</p>
            <div class="field">
              <label for="email">Email</label>
              <input class="input" id="email" name="email" value="admin@example.com" autocomplete="username">
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input class="input" id="password" name="password" type="password" value="admin123" autocomplete="current-password">
            </div>
            <button class="btn primary" type="submit"><span class="icon">→</span>进入后台</button>
          </form>
        </section>
      </div>
    `;

    app.querySelector("[data-form='login']").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email")).trim();
      const password = String(form.get("password"));
      if (email !== "admin@example.com" || password !== "admin123") {
        showToast("账号或密码错误，请使用 README 中的 mock 账号。");
        return;
      }
      state.session = { active: true, user: email };
      persist();
      navigate("dashboard");
    });
  }

  function dashboardPage() {
    const published = state.posts.filter((item) => item.status === "published").length;
    const drafts = state.posts.filter((item) => item.status === "draft").length;
    return `
      ${pageHeader("Dashboard", "快速查看内容资产和站点运行状态。", `<a class="btn primary" href="#/posts/new"><span class="icon">+</span>新建文章</a>`)}
      <section class="grid cols-4">
        ${metric("文章总数", state.posts.length)}
        ${metric("已发布", published)}
        ${metric("草稿", drafts)}
        ${metric("分类 / 标签", `${state.categories.length} / ${state.tags.length}`)}
      </section>
      <section class="grid cols-2" style="margin-top:16px">
        <div class="card section">
          <div class="section-header"><h2>最近更新</h2><a class="btn" href="#/posts">查看全部</a></div>
          <ul class="list">
            ${state.posts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map((post) => `
              <li>
                <div>
                  <strong>${escapeHtml(post.title)}</strong>
                  <div class="muted">${escapeHtml(post.category)} · ${post.updatedAt}</div>
                </div>
                <span class="status ${post.status}">${statusMap[post.status]}</span>
              </li>
            `).join("")}
          </ul>
        </div>
        <div class="card section">
          <div class="section-header"><h2>发布配置</h2><a class="btn" href="#/settings">配置</a></div>
          <div class="grid">
            ${settingLine("评论功能", state.settings.commentsEnabled ? "已开启" : "已关闭", state.settings.commentsEnabled ? "good" : "muted")}
            ${settingLine("维护模式", state.settings.maintenanceMode ? "已开启" : "未开启", state.settings.maintenanceMode ? "warn" : "good")}
            ${settingLine("默认文章状态", statusMap[state.settings.defaultStatus], "muted")}
          </div>
        </div>
      </section>
    `;
  }

  function metric(label, value) {
    return `<div class="card metric"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function settingLine(label, value, tone) {
    return `<div class="list"><li><span>${label}</span><span class="pill ${tone}">${value}</span></li></div>`;
  }

  function postsPage() {
    const posts = filteredPosts();
    return `
      ${pageHeader("文章管理", "搜索、筛选并维护文章状态。", `<a class="btn primary" href="#/posts/new"><span class="icon">+</span>新建文章</a>`)}
      <section class="card section">
        <div class="filters">
          <input class="input" data-filter="postSearch" placeholder="搜索标题、摘要或 slug" value="${escapeAttr(state.ui.postSearch)}">
          <select class="select" data-filter="postCategory">
            <option value="all">全部分类</option>
            ${state.categories.map((item) => `<option value="${escapeAttr(item.name)}" ${state.ui.postCategory === item.name ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
          <select class="select" data-filter="postStatus">
            <option value="all">全部状态</option>
            ${Object.entries(statusMap).map(([value, label]) => `<option value="${value}" ${state.ui.postStatus === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>标题</th><th>分类</th><th>标签</th><th>状态</th><th>更新</th><th>操作</th></tr></thead>
            <tbody>
              ${posts.length ? posts.map(postRow).join("") : `<tr><td colspan="6"><div class="empty">没有匹配的文章</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function postRow(post) {
    return `
      <tr>
        <td><strong>${escapeHtml(post.title)}</strong><div class="muted">${escapeHtml(post.slug)}</div></td>
        <td>${escapeHtml(post.category)}</td>
        <td>${post.tags.map((tag) => `<span class="pill muted">${escapeHtml(tag)}</span>`).join(" ")}</td>
        <td><span class="status ${post.status}">${statusMap[post.status]}</span></td>
        <td>${post.updatedAt}</td>
        <td>
          <div class="row-actions">
            <a class="btn" href="#/posts/edit/${post.id}">编辑</a>
            <button class="btn" data-action="cycle-post-status" data-id="${post.id}">切换状态</button>
          </div>
        </td>
      </tr>
    `;
  }

  function filteredPosts() {
    const query = state.ui.postSearch.toLowerCase();
    return state.posts.filter((post) => {
      const matchQuery = !query || [post.title, post.slug, post.excerpt].join(" ").toLowerCase().includes(query);
      const matchCategory = state.ui.postCategory === "all" || post.category === state.ui.postCategory;
      const matchStatus = state.ui.postStatus === "all" || post.status === state.ui.postStatus;
      return matchQuery && matchCategory && matchStatus;
    });
  }

  function postEditorPage(id) {
    const post = id ? state.posts.find((item) => item.id === id) : null;
    const model = post || {
      id: "",
      title: "",
      slug: "",
      category: state.categories[0]?.name || "",
      tags: [],
      status: state.settings.defaultStatus,
      excerpt: "",
      content: "",
      updatedAt: today()
    };
    return `
      ${pageHeader(id ? "编辑文章" : "新建文章", "保存后会写入本地 mock 状态，后续可替换为 API。", `<a class="btn" href="#/posts"><span class="icon">←</span>返回列表</a>`)}
      <form class="form-layout" data-form="post-editor" data-id="${model.id}">
        <section class="card section">
          <div class="field">
            <label for="title">标题</label>
            <input class="input" id="title" name="title" required value="${escapeAttr(model.title)}">
          </div>
          <div class="field">
            <label for="slug">Slug</label>
            <input class="input" id="slug" name="slug" required value="${escapeAttr(model.slug)}">
          </div>
          <div class="field">
            <label for="excerpt">摘要</label>
            <textarea class="textarea" id="excerpt" name="excerpt">${escapeHtml(model.excerpt)}</textarea>
          </div>
          <div class="field">
            <label for="content">正文</label>
            <textarea class="textarea" id="content" name="content" style="min-height:260px">${escapeHtml(model.content)}</textarea>
          </div>
        </section>
        <aside class="card section">
          <div class="field">
            <label for="category">分类</label>
            <select class="select" id="category" name="category">
              ${state.categories.map((item) => `<option value="${escapeAttr(item.name)}" ${model.category === item.name ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="status">状态</label>
            <select class="select" id="status" name="status">
              ${Object.entries(statusMap).map(([value, label]) => `<option value="${value}" ${model.status === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>标签</label>
            <div class="grid">
              ${state.tags.map((tag) => `
                <label class="switch">
                  <input type="checkbox" name="tags" value="${escapeAttr(tag.name)}" ${model.tags.includes(tag.name) ? "checked" : ""}>
                  <span class="switch-track"></span>
                  <span><span class="tag-swatch" style="background:${escapeAttr(tag.color)}"></span>${escapeHtml(tag.name)}</span>
                </label>
              `).join("")}
            </div>
          </div>
          <div class="actions">
            <button class="btn primary" type="submit"><span class="icon">✓</span>保存</button>
            <a class="btn" href="#/posts">取消</a>
          </div>
        </aside>
      </form>
    `;
  }

  function categoriesPage() {
    const editing = state.categories.find((item) => item.id === state.ui.editingCategoryId);
    return `
      ${pageHeader("分类管理", "维护文章分类和前台可见状态。", "")}
      <section class="card section">
        <form class="inline-form" data-form="category">
          <div class="field">
            <label for="categoryName">分类名称</label>
            <input class="input" id="categoryName" name="name" required value="${escapeAttr(editing?.name || "")}">
          </div>
          <div class="field">
            <label for="categorySlug">Slug</label>
            <input class="input" id="categorySlug" name="slug" required value="${escapeAttr(editing?.slug || "")}">
          </div>
          <button class="btn primary" type="submit">${editing ? "保存分类" : "新增分类"}</button>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>名称</th><th>Slug</th><th>描述</th><th>启用</th><th>操作</th></tr></thead>
            <tbody>
              ${state.categories.map((item) => `
                <tr>
                  <td><strong>${escapeHtml(item.name)}</strong></td>
                  <td>${escapeHtml(item.slug)}</td>
                  <td>${escapeHtml(item.description)}</td>
                  <td>
                    <label class="switch">
                      <input type="checkbox" data-action="toggle-category" data-id="${item.id}" ${item.enabled ? "checked" : ""}>
                      <span class="switch-track"></span>
                    </label>
                  </td>
                  <td><button class="btn" data-action="edit-category" data-id="${item.id}">编辑</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function tagsPage() {
    return `
      ${pageHeader("标签管理", "创建标签并配置用于列表展示的颜色。", "")}
      <section class="card section">
        <form class="inline-form" data-form="tag">
          <div class="field">
            <label for="tagName">标签名称</label>
            <input class="input" id="tagName" name="name" required>
          </div>
          <div class="field">
            <label for="tagColor">颜色</label>
            <input class="input" id="tagColor" name="color" type="color" value="#1267d8">
          </div>
          <button class="btn primary" type="submit">新增标签</button>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>标签</th><th>颜色</th><th>文章数</th><th>操作</th></tr></thead>
            <tbody>
              ${state.tags.map((tag) => `
                <tr>
                  <td><span class="tag-swatch" style="background:${escapeAttr(tag.color)}"></span><strong>${escapeHtml(tag.name)}</strong></td>
                  <td>${escapeHtml(tag.color)}</td>
                  <td>${state.posts.filter((post) => post.tags.includes(tag.name)).length}</td>
                  <td><button class="btn danger" data-action="delete-tag" data-id="${tag.id}">删除</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function aboutPage() {
    return `
      ${pageHeader("关于我配置", "维护作者资料、头像和社交链接。", "")}
      <form class="grid cols-2" data-form="about">
        <section class="card section">
          <div class="field"><label for="name">名称</label><input class="input" id="name" name="name" value="${escapeAttr(state.about.name)}"></div>
          <div class="field"><label for="title">身份</label><input class="input" id="title" name="title" value="${escapeAttr(state.about.title)}"></div>
          <div class="field"><label for="avatar">头像 URL</label><input class="input" id="avatar" name="avatar" value="${escapeAttr(state.about.avatar)}"></div>
          <div class="field"><label for="bio">简介</label><textarea class="textarea" id="bio" name="bio">${escapeHtml(state.about.bio)}</textarea></div>
        </section>
        <section class="card section">
          <div class="field"><label for="github">GitHub</label><input class="input" id="github" name="github" value="${escapeAttr(state.about.github)}"></div>
          <div class="field"><label for="email">Email</label><input class="input" id="email" name="email" value="${escapeAttr(state.about.email)}"></div>
          <div class="actions"><button class="btn primary" type="submit"><span class="icon">✓</span>保存关于我</button></div>
        </section>
      </form>
    `;
  }

  function settingsPage() {
    return `
      ${pageHeader("站点设置", "集中维护站点信息、SEO 和发布默认项。", "")}
      <form class="grid cols-2" data-form="settings">
        <section class="card section">
          <div class="field"><label for="siteName">站点名称</label><input class="input" id="siteName" name="siteName" value="${escapeAttr(state.settings.siteName)}"></div>
          <div class="field"><label for="domain">站点域名</label><input class="input" id="domain" name="domain" value="${escapeAttr(state.settings.domain)}"></div>
          <div class="field"><label for="description">站点描述</label><textarea class="textarea" id="description" name="description">${escapeHtml(state.settings.description)}</textarea></div>
        </section>
        <section class="card section">
          <div class="field"><label for="seoTitle">SEO 标题</label><input class="input" id="seoTitle" name="seoTitle" value="${escapeAttr(state.settings.seoTitle)}"></div>
          <div class="field"><label for="seoKeywords">SEO Keywords</label><input class="input" id="seoKeywords" name="seoKeywords" value="${escapeAttr(state.settings.seoKeywords)}"></div>
          <div class="field">
            <label for="defaultStatus">默认文章状态</label>
            <select class="select" id="defaultStatus" name="defaultStatus">
              ${Object.entries(statusMap).map(([value, label]) => `<option value="${value}" ${state.settings.defaultStatus === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </div>
          <label class="switch"><input type="checkbox" name="commentsEnabled" ${state.settings.commentsEnabled ? "checked" : ""}><span class="switch-track"></span><span>开启评论</span></label>
          <br><br>
          <label class="switch"><input type="checkbox" name="maintenanceMode" ${state.settings.maintenanceMode ? "checked" : ""}><span class="switch-track"></span><span>维护模式</span></label>
          <div class="actions" style="margin-top:18px"><button class="btn primary" type="submit"><span class="icon">✓</span>保存设置</button></div>
        </section>
      </form>
    `;
  }

  function notFoundPage() {
    return `${pageHeader("页面不存在", "请从左侧导航进入后台功能。", `<a class="btn primary" href="#/dashboard">回到 Dashboard</a>`)}`;
  }

  function bindPage(page) {
    app.querySelector("[data-action='logout']")?.addEventListener("click", () => {
      state.session.active = false;
      persist("已退出登录。");
      navigate("login");
    });

    app.querySelectorAll("[data-filter]").forEach((field) => {
      field.addEventListener("input", handlePostFilter);
      field.addEventListener("change", handlePostFilter);
    });

    app.querySelectorAll("[data-action='cycle-post-status']").forEach((button) => {
      button.addEventListener("click", () => cyclePostStatus(Number(button.dataset.id)));
    });

    app.querySelector("[data-form='post-editor']")?.addEventListener("submit", savePost);
    app.querySelector("[data-form='category']")?.addEventListener("submit", saveCategory);
    app.querySelector("[data-form='tag']")?.addEventListener("submit", saveTag);
    app.querySelector("[data-form='about']")?.addEventListener("submit", saveAbout);
    app.querySelector("[data-form='settings']")?.addEventListener("submit", saveSettings);

    app.querySelectorAll("[data-action='toggle-category']").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const item = state.categories.find((category) => category.id === Number(checkbox.dataset.id));
        item.enabled = checkbox.checked;
        persist("分类状态已更新。");
      });
    });

    app.querySelectorAll("[data-action='edit-category']").forEach((button) => {
      button.addEventListener("click", () => {
        state.ui.editingCategoryId = Number(button.dataset.id);
        render();
      });
    });

    app.querySelectorAll("[data-action='delete-tag']").forEach((button) => {
      button.addEventListener("click", () => {
        const tag = state.tags.find((item) => item.id === Number(button.dataset.id));
        state.tags = state.tags.filter((item) => item.id !== tag.id);
        state.posts = state.posts.map((post) => ({ ...post, tags: post.tags.filter((name) => name !== tag.name) }));
        persist("标签已删除，并从文章中移除。");
        render();
      });
    });
  }

  function handlePostFilter(event) {
    state.ui[event.currentTarget.dataset.filter] = event.currentTarget.value;
    persist();
    render();
  }

  function cyclePostStatus(id) {
    const order = ["draft", "published", "archived"];
    const post = state.posts.find((item) => item.id === id);
    post.status = order[(order.indexOf(post.status) + 1) % order.length];
    post.updatedAt = today();
    persist("文章状态已切换。");
    render();
  }

  function savePost(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Number(event.currentTarget.dataset.id);
    const payload = {
      id: id || nextId(state.posts),
      title: String(form.get("title")).trim(),
      slug: String(form.get("slug")).trim(),
      category: String(form.get("category")),
      tags: form.getAll("tags").map(String),
      status: String(form.get("status")),
      excerpt: String(form.get("excerpt")).trim(),
      content: String(form.get("content")).trim(),
      updatedAt: today()
    };
    if (id) {
      state.posts = state.posts.map((item) => item.id === id ? payload : item);
    } else {
      state.posts.unshift(payload);
    }
    persist("文章已保存。");
    navigate("posts");
  }

  function saveCategory(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      id: state.ui.editingCategoryId || nextId(state.categories),
      name: String(form.get("name")).trim(),
      slug: String(form.get("slug")).trim(),
      enabled: true,
      description: "后续可接入分类描述字段"
    };
    if (state.ui.editingCategoryId) {
      state.categories = state.categories.map((item) => item.id === payload.id ? { ...item, ...payload, enabled: item.enabled } : item);
    } else {
      state.categories.push(payload);
    }
    state.ui.editingCategoryId = null;
    persist("分类已保存。");
    render();
  }

  function saveTag(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.tags.push({
      id: nextId(state.tags),
      name: String(form.get("name")).trim(),
      color: String(form.get("color"))
    });
    persist("标签已新增。");
    render();
  }

  function saveAbout(event) {
    event.preventDefault();
    state.about = Object.fromEntries(new FormData(event.currentTarget).entries());
    persist("关于我配置已保存。");
    render();
  }

  function saveSettings(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    state.settings = {
      siteName: String(form.get("siteName")).trim(),
      domain: String(form.get("domain")).trim(),
      description: String(form.get("description")).trim(),
      seoTitle: String(form.get("seoTitle")).trim(),
      seoKeywords: String(form.get("seoKeywords")).trim(),
      defaultStatus: String(form.get("defaultStatus")),
      commentsEnabled: form.has("commentsEnabled"),
      maintenanceMode: form.has("maintenanceMode")
    };
    persist("站点设置已保存。");
    render();
  }

  function showToast(message) {
    document.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function nextId(items) {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
