// ===== Config =====
const API_BASE = "http://localhost:8080/api";

// ===== API Client =====
async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ===== Theme =====
const themeToggle = document.getElementById("themeToggle");
function loadTheme() {
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "dark"); // default dark
  document.documentElement.setAttribute("data-theme", theme);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
themeToggle?.addEventListener("click", toggleTheme);
loadTheme();

// ===== Utils =====
const app = document.querySelector("#app");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const progressBar = document.getElementById("progressBar");

function navigate(path) {
  history.pushState({}, "", path);
  render();
}

function setTitle(title) {
  document.title = title ? `${title} · From Zero Blog` : "From Zero Blog";
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function highlightText(text, keyword) {
  if (!keyword) return text;
  const safe = escapeHtml(keyword);
  const regex = new RegExp(`(${safe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function mdToHtml(md) {
  if (!md) return "";
  let html = escapeHtml(md);
  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Lists
  html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  // Blockquote
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");
  // Paragraphs
  html = html.replace(/^(?!<[hluob])(.+)$/gim, "<p>$1</p>");
  // Clean up empty tags
  html = html.replace(/<p><\/p>/g, "");
  return html;
}

function readingTime(content) {
  const words = (content || "").length / 2; // rough CJK estimation
  const mins = Math.max(1, Math.ceil(words / 300));
  return `${mins} 分钟阅读`;
}

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Scroll Progress =====
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + "%";
}
window.addEventListener("scroll", updateProgress, { passive: true });

// ===== Components =====
function postCard(post, keyword = "") {
  const cover = post.cover || "linear-gradient(135deg, #334155, #1e293b)";
  const categoryName = post.category?.name || "";
  const tagsHtml = (post.tags || []).map((t) => `<a href="/categories?tag=${encodeURIComponent(t.slug)}" data-link>#${t.name}</a>`).join("");
  return `
    <article class="post-card">
      <a class="card-cover" style="background:${cover}" href="/post/${post.slug}" data-link aria-label="阅读 ${escapeHtml(post.title)}"></a>
      <div class="card-body">
        <div class="meta-row">
          <span>${escapeHtml(categoryName)}</span>
          <span>${formatDate(post.publishedAt || post.createdAt)}</span>
          <span>${readingTime(post.content)}</span>
        </div>
        <h3><a href="/post/${post.slug}" data-link>${highlightText(escapeHtml(post.title), keyword)}</a></h3>
        <p>${highlightText(escapeHtml(post.excerpt), keyword)}</p>
        <div class="tag-row">${tagsHtml}</div>
      </div>
    </article>
  `;
}

function loadingGrid(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="post-card">
      <div class="card-cover loading-skeleton" style="min-height:160px"></div>
      <div class="card-body">
        <div class="meta-row loading-skeleton" style="height:14px;width:60%"></div>
        <div class="loading-skeleton" style="height:22px;width:80%;margin-top:0.6rem"></div>
        <div class="loading-skeleton" style="height:14px;width:90%;margin-top:0.3rem"></div>
      </div>
    </div>
  `).join("");
}

// ===== Pages =====

async function renderHome() {
  setTitle("");
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Blog frontend redesign</p>
        <h1>From Zero</h1>
        <p>面向真实阅读、筛选和跳转场景重建的前台界面。记录可复用的工程实现过程。</p>
        <div class="hero-actions">
          <a class="button primary" href="/posts" data-link>浏览文章</a>
          <a class="button secondary" href="/categories" data-link>按主题查找</a>
        </div>
      </div>
      <aside class="hero-panel" aria-label="站点概览">
        <div class="loading-skeleton" style="height:36px;width:50px"></div>
        <div class="loading-skeleton" style="height:14px;width:60px"></div>
        <div class="loading-skeleton" style="height:36px;width:50px"></div>
        <div class="loading-skeleton" style="height:14px;width:60px"></div>
        <div class="loading-skeleton" style="height:36px;width:50px"></div>
        <div class="loading-skeleton" style="height:14px;width:60px"></div>
      </aside>
    </section>
    <section class="section">
      <div class="section-heading">
        <p class="eyebrow">精选阅读</p>
        <h2>先从这些文章开始</h2>
      </div>
      <div class="featured-grid">${loadingGrid(2)}</div>
    </section>
    <section class="section split-section">
      <div>
        <p class="eyebrow">最近更新</p>
        <h2>新的工程记录</h2>
      </div>
      <div class="compact-list">
        ${Array.from({ length: 3 }, () => `<div class="loading-skeleton" style="height:52px"></div>`).join("")}
      </div>
    </section>
  `;

  try {
    const [postsRes, catsRes, tagsRes] = await Promise.all([
      api("/posts?pageSize=100"),
      api("/categories"),
      api("/tags"),
    ]);
    const posts = postsRes.data || [];
    const categories = catsRes || [];
    const tags = tagsRes || [];

    const featured = posts.filter((p) => p.featured).slice(0, 2);
    const latest = posts.slice(0, 5);

    app.innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Blog frontend redesign</p>
          <h1>From Zero</h1>
          <p>面向真实阅读、筛选和跳转场景重建的前台界面。记录可复用的工程实现过程。</p>
          <div class="hero-actions">
            <a class="button primary" href="/posts" data-link>浏览文章</a>
            <a class="button secondary" href="/categories" data-link>按主题查找</a>
          </div>
        </div>
        <aside class="hero-panel" aria-label="站点概览">
          <strong>${posts.length}</strong><span>篇内容</span>
          <strong>${categories.length}</strong><span>个分类</span>
          <strong>${tags.length}</strong><span>个标签</span>
        </aside>
      </section>
      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">精选阅读</p>
          <h2>先从这些文章开始</h2>
        </div>
        <div class="featured-grid">${featured.map(postCard).join("") || "<p>暂无精选文章。</p>"}</div>
      </section>
      <section class="section split-section">
        <div>
          <p class="eyebrow">最近更新</p>
          <h2>新的工程记录</h2>
        </div>
        <div class="compact-list">
          ${latest.map((post) => `
            <a href="/post/${post.slug}" data-link>
              <span>${escapeHtml(post.title)}</span>
              <small>${formatDate(post.publishedAt || post.createdAt)}</small>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  } catch (e) {
    app.querySelector(".hero").innerHTML += `<p style="color:var(--warm)">加载失败: ${e.message}</p>`;
  }
}

async function renderPosts() {
  const params = new URLSearchParams(location.search);
  const q = (params.get("q") || "").trim();
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";
  const page = parseInt(params.get("page") || "1", 10);

  setTitle("文章");
  app.innerHTML = `
    <section class="page-head">
      <p class="eyebrow">Posts</p>
      <h1>文章列表</h1>
      <p>按关键词、分类或标签筛选内容，点击卡片进入完整文章。</p>
    </section>
    <section class="toolbar" aria-label="文章筛选">
      <label>
        <span>搜索</span>
        <input id="searchInput" type="search" value="${escapeHtml(q)}" placeholder="标题、摘要、标签" />
      </label>
      <label>
        <span>分类</span>
        <select id="categorySelect"><option value="">全部</option></select>
      </label>
      <button class="button primary" type="button" id="applySearch">筛选</button>
      ${tag ? `<button class="button text" type="button" id="clearTag">清除标签 #${escapeHtml(tag)}</button>` : ""}
    </section>
    <section class="post-grid" aria-live="polite">${loadingGrid()}</section>
    <div class="pagination" id="pagination"></div>
  `;

  try {
    const [postsRes, catsRes] = await Promise.all([
      api(`/posts?keyword=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&tag=${encodeURIComponent(tag)}&page=${page}&pageSize=10`),
      api("/categories"),
    ]);

    const posts = postsRes.data || [];
    const total = postsRes.total || 0;
    const pageSize = postsRes.pageSize || 10;
    const cats = catsRes || [];

    const catSelect = document.getElementById("categorySelect");
    catSelect.innerHTML = `<option value="">全部</option>` +
      cats.map((c) => `<option value="${c.id}" ${c.id === category ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("");

    const grid = document.querySelector(".post-grid");
    grid.innerHTML = posts.length
      ? posts.map((p) => postCard(p, q)).join("")
      : `<div class="empty-state"><h2>没有匹配内容</h2><p>换一个关键词或清除筛选条件再试。</p></div>`;

    renderPagination(total, pageSize, page, params);

    document.getElementById("applySearch").addEventListener("click", () => {
      const value = document.getElementById("searchInput").value.trim();
      const cat = document.getElementById("categorySelect").value;
      const p = new URLSearchParams();
      if (value) p.set("q", value);
      if (cat) p.set("category", cat);
      if (tag) p.set("tag", tag);
      navigate(`/posts?${p.toString()}`);
    });
    document.getElementById("searchInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("applySearch").click();
    });
    document.getElementById("categorySelect")?.addEventListener("change", () => {
      document.getElementById("applySearch").click();
    });
    document.getElementById("clearTag")?.addEventListener("click", () => {
      params.delete("tag");
      navigate(`/posts?${params.toString()}`);
    });
  } catch (e) {
    app.querySelector(".post-grid").innerHTML = `<div class="empty-state"><h2>加载失败</h2><p>${e.message}</p></div>`;
  }
}

function renderPagination(total, pageSize, currentPage, params) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    document.getElementById("pagination").innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      const p = new URLSearchParams(params);
      p.set("page", String(i));
      html += `<button class="${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span style="color:var(--ink-muted);align-self:center">...</span>`;
    }
  }
  const container = document.getElementById("pagination");
  container.innerHTML = html;
  container.querySelectorAll("button[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = new URLSearchParams(params);
      p.set("page", btn.dataset.page);
      navigate(`/posts?${p.toString()}`);
    });
  });
}

async function renderPostDetail(slug) {
  setTitle("加载中...");
  app.innerHTML = `
    <article class="article">
      <div class="loading-skeleton" style="height:280px;border-radius:var(--radius);margin-bottom:2rem"></div>
      <div class="loading-skeleton" style="height:28px;width:70%;margin-bottom:0.5rem"></div>
      <div class="loading-skeleton" style="height:16px;width:40%;margin-bottom:2rem"></div>
      <div class="loading-skeleton" style="height:14px;width:100%;margin-bottom:0.5rem"></div>
      <div class="loading-skeleton" style="height:14px;width:95%;margin-bottom:0.5rem"></div>
      <div class="loading-skeleton" style="height:14px;width:90%"></div>
    </article>
  `;

  try {
    const post = await api(`/posts/${encodeURIComponent(slug)}`);
    setTitle(post.title);

    const relatedRes = await api(`/posts?pageSize=2&category=${encodeURIComponent(post.categoryId)}`);
    const related = (relatedRes.data || []).filter((p) => p.id !== post.id).slice(0, 2);

    const comments = await api(`/posts/${encodeURIComponent(slug)}/comments`).catch(() => []);

    app.innerHTML = `
      <article class="article">
        <a class="back-link" href="/posts" data-link>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          返回文章列表
        </a>
        <div class="article-cover" style="background:${post.cover || "linear-gradient(135deg, #334155, #1e293b)"}"></div>
        <div class="article-head">
          <div class="meta-row">
            <span>${escapeHtml(post.category?.name || "")}</span>
            <span>${formatDate(post.publishedAt || post.createdAt)}</span>
            <span>${readingTime(post.content)}</span>
            <span>${post.viewCount || 0} 阅读</span>
          </div>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.excerpt)}</p>
          <div class="tag-row">
            ${(post.tags || []).map((t) => `<a href="/categories?tag=${encodeURIComponent(t.slug)}" data-link>#${t.name}</a>`).join("")}
          </div>
        </div>
        <div class="article-body">
          ${mdToHtml(post.content)}
        </div>
      </article>
      <script>if(window.hljs){hljs.highlightAll();}</script>
      ${related.length ? `
        <section class="section">
          <div class="section-heading">
            <p class="eyebrow">Related</p>
            <h2>继续阅读</h2>
          </div>
          <div class="featured-grid">${related.map(postCard).join("")}</div>
        </section>
      ` : ""}
      <section class="comments-section">
        <div class="section-heading">
          <p class="eyebrow">Comments</p>
          <h2>评论 (${comments.length})</h2>
        </div>
        <form class="comment-form" id="commentForm">
          <div class="form-row">
            <input type="text" name="author" placeholder="昵称" required />
            <input type="email" name="email" placeholder="邮箱" required />
          </div>
          <textarea name="content" placeholder="写下你的想法..." required></textarea>
          <button type="submit" class="button primary">提交评论</button>
        </form>
        <div id="commentsList">
          ${comments.length ? comments.map((c) => `
            <div class="comment-item">
              <div class="comment-header">
                <span class="comment-author">${escapeHtml(c.author)}</span>
                <span class="comment-date">${formatDate(c.createdAt)}</span>
              </div>
              <div class="comment-content">${escapeHtml(c.content)}</div>
            </div>
          `).join("") : "<p style=\"color:var(--ink-muted)\">暂无评论，来抢沙发吧！</p>"}
        </div>
      </section>
    `;

    document.getElementById("commentForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api(`/posts/${encodeURIComponent(slug)}/comments`, {
          method: "POST",
          body: { author: fd.get("author"), email: fd.get("email"), content: fd.get("content") },
        });
        showToast("评论已提交，等待审核");
        e.target.reset();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  } catch (e) {
    app.innerHTML = `
      <section class="not-found">
        <p class="eyebrow">Error</p>
        <h1>加载失败</h1>
        <p>${e.message}</p>
        <div class="hero-actions">
          <a class="button primary" href="/posts" data-link>返回文章列表</a>
        </div>
      </section>
    `;
  }
}

async function renderCategories() {
  setTitle("分类标签");
  app.innerHTML = `
    <section class="page-head">
      <p class="eyebrow">Topics</p>
      <h1>分类与标签</h1>
      <p>分类用于主题聚合，标签用于跨主题发现。</p>
    </section>
    <section class="topic-layout">
      <div class="topic-column">
        <h2>分类</h2>
        ${Array.from({ length: 4 }, () => `<div class="loading-skeleton" style="height:48px"></div>`).join("")}
      </div>
      <div class="topic-column">
        <h2>标签</h2>
        <div class="tag-cloud">${Array.from({ length: 6 }, () => `<div class="loading-skeleton" style="height:28px;width:70px;display:inline-block;margin:0.3rem"></div>`).join("")}</div>
      </div>
    </section>
  `;

  try {
    const params = new URLSearchParams(location.search);
    const activeTag = params.get("tag");
    const [cats, tags] = await Promise.all([api("/categories"), api("/tags")]);

    app.innerHTML = `
      <section class="page-head">
        <p class="eyebrow">Topics</p>
        <h1>分类与标签</h1>
        <p>分类用于主题聚合，标签用于跨主题发现。</p>
      </section>
      <section class="topic-layout">
        <div class="topic-column">
          <h2>分类</h2>
          ${cats.map((c) => `
            <a class="topic-item" href="/posts?category=${encodeURIComponent(c.id)}" data-link>
              <span>${escapeHtml(c.name)}</span>
              <strong>${c.postCount || 0}</strong>
            </a>
          `).join("")}
        </div>
        <div class="topic-column">
          <h2>标签</h2>
          <div class="tag-cloud">
            ${tags.map((t) => `
              <a class="${activeTag === t.slug ? "active" : ""}" href="/categories?tag=${encodeURIComponent(t.slug)}" data-link>#${t.name}</a>
            `).join("")}
          </div>
        </div>
      </section>
      ${activeTag ? `<section class="section" id="tagPosts"></section>` : ""}
    `;

    if (activeTag) {
      const res = await api(`/posts?tag=${encodeURIComponent(activeTag)}`);
      const posts = res.data || [];
      document.getElementById("tagPosts").innerHTML = `
        <div class="section-heading">
          <p class="eyebrow">#${escapeHtml(activeTag)}</p>
          <h2>标签文章</h2>
        </div>
        <div class="post-grid">${posts.map(postCard).join("") || "<p style=\"color:var(--ink-muted)\">该标签下暂无文章。</p>"}</div>
      `;
    }
  } catch (e) {
    app.innerHTML += `<p style="color:var(--warm);padding:2rem">加载失败: ${e.message}</p>`;
  }
}

async function renderArchives() {
  setTitle("归档");
  app.innerHTML = `
    <section class="page-head">
      <p class="eyebrow">Archives</p>
      <h1>归档</h1>
      <p>按发布时间回看所有内容。</p>
    </section>
    <section class="archive-list">
      ${Array.from({ length: 4 }, () => `<div class="loading-skeleton" style="height:120px;margin-bottom:0.6rem"></div>`).join("")}
    </section>
  `;

  try {
    const [archives, postsRes] = await Promise.all([
      api("/archives"),
      api("/posts?pageSize=100"),
    ]);
    const posts = postsRes.data || [];

    const grouped = posts.reduce((acc, post) => {
      const d = new Date(post.publishedAt || post.createdAt);
      const year = d.getFullYear();
      acc[year] = acc[year] || [];
      acc[year].push(post);
      return acc;
    }, {});

    app.innerHTML = `
      <section class="page-head">
        <p class="eyebrow">Archives</p>
        <h1>归档</h1>
        <p>按发布时间回看所有内容。</p>
      </section>
      <section class="archive-list">
        ${Object.entries(grouped).sort((a, b) => b[0] - a[0]).map(([year, items]) => `
          <div class="archive-year">
            <h2>${year}</h2>
            ${items.map((post) => `
              <a href="/post/${post.slug}" data-link>
                <time>${formatDate(post.publishedAt || post.createdAt)}</time>
                <span>${escapeHtml(post.title)}</span>
                <small>${escapeHtml(post.category?.name || "")}</small>
              </a>
            `).join("")}
          </div>
        `).join("")}
      </section>
    `;
  } catch (e) {
    app.querySelector(".archive-list").innerHTML = `<div class="empty-state"><h2>加载失败</h2><p>${e.message}</p></div>`;
  }
}

async function renderAbout() {
  setTitle("关于");
  try {
    const settings = await api("/site-settings");
    app.innerHTML = `
      <section class="about-page">
        <div>
          <p class="eyebrow">About</p>
          <h1>${escapeHtml(settings.authorName || "Admin")}</h1>
          <p>${escapeHtml(settings.authorBio || "")}</p>
          <div class="hero-actions">
            <a class="button secondary" href="/posts" data-link>浏览文章</a>
            <a class="button secondary" href="mailto:${escapeHtml(settings.authorEmail || "")}">联系我</a>
          </div>
        </div>
        <div class="principles">
          <h2>内容方向</h2>
          <ul>
            <li>记录可复用的工程实现过程。</li>
            <li>把产品判断和技术取舍写清楚。</li>
            <li>用分类、标签和归档支持长期检索。</li>
          </ul>
        </div>
      </section>
    `;
  } catch (e) {
    app.innerHTML = `<p style="color:var(--warm);padding:2rem">加载失败: ${e.message}</p>`;
  }
}

function renderNotFound() {
  setTitle("404");
  app.innerHTML = `
    <section class="not-found">
      <p class="eyebrow">404</p>
      <h1>页面不存在</h1>
      <p>这个地址没有匹配到前台页面，可以返回首页或文章列表继续浏览。</p>
      <div class="hero-actions" style="justify-content:center">
        <a class="button primary" href="/" data-link>回到首页</a>
        <a class="button secondary" href="/posts" data-link>查看文章</a>
      </div>
    </section>
  `;
}

// ===== Admin =====
function getToken() {
  return localStorage.getItem("admin_token");
}

function isLoggedIn() {
  return !!getToken();
}

async function renderAdmin() {
  if (!isLoggedIn()) {
    renderAdminLogin();
    return;
  }
  const hash = location.hash.slice(1) || "posts";
  const hashParts = hash.split("/");
  const activeTab = hashParts[0];
  setTitle("管理后台");
  app.innerHTML = `
    <div class="admin-dashboard">
      <div class="admin-header">
        <h1>管理后台</h1>
        <button class="button text" id="adminLogout">退出登录</button>
      </div>
      <nav class="admin-nav">
        <a href="/admin#stats" class="${activeTab === "stats" ? "active" : ""}">统计</a>
        <a href="/admin#posts" class="${activeTab === "posts" ? "active" : ""}">文章</a>
        <a href="/admin#categories" class="${activeTab === "categories" ? "active" : ""}">分类</a>
        <a href="/admin#tags" class="${activeTab === "tags" ? "active" : ""}">标签</a>
        <a href="/admin#comments" class="${activeTab === "comments" ? "active" : ""}">评论</a>
        <a href="/admin#settings" class="${activeTab === "settings" ? "active" : ""}">设置</a>
      </nav>
      <div id="adminContent"></div>
    </div>
  `;

  document.getElementById("adminLogout")?.addEventListener("click", () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin");
  });

  const content = document.getElementById("adminContent");
  try {
    if (activeTab === "stats") {
      await renderAdminStats(content);
    } else if (activeTab === "posts" && hashParts[1] === "new") {
      await renderAdminPostEditor(content);
    } else if (activeTab === "posts" && hashParts[1] === "edit" && hashParts[2]) {
      await renderAdminPostEditor(content, hashParts[2]);
    } else if (activeTab === "posts") {
      await renderAdminPosts(content);
    } else if (activeTab === "categories") {
      await renderAdminCategories(content);
    } else if (activeTab === "tags") {
      await renderAdminTags(content);
    } else if (activeTab === "comments") {
      await renderAdminComments(content);
    } else if (activeTab === "settings") {
      await renderAdminSettings(content);
    }
  } catch (e) {
    content.innerHTML = `<p style="color:var(--warm)">加载失败: ${e.message}</p>`;
  }
}

function renderAdminLogin() {
  setTitle("登录");
  app.innerHTML = `
    <div class="admin-login">
      <h1>管理后台登录</h1>
      <form id="loginForm">
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" name="email" value="admin@blog.local" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" name="password" value="admin123" required />
        </div>
        <button type="submit" class="button primary">登录</button>
      </form>
    </div>
  `;

  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api("/admin/auth/login", {
        method: "POST",
        body: { email: fd.get("email"), password: fd.get("password") },
      });
      localStorage.setItem("admin_token", res.token);
      localStorage.setItem("admin_user", JSON.stringify(res.user));
      showToast("登录成功");
      navigate("/admin#posts");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

async function renderAdminPosts(container) {
  const res = await api("/admin/posts?pageSize=50", { token: getToken() });
  const posts = res.data || [];
  const cats = await api("/admin/categories", { token: getToken() });
  const tags = await api("/admin/tags", { token: getToken() });

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="color:var(--ink-muted);font-size:0.9rem">共 ${res.total || 0} 篇</span>
      <button class="button primary" id="newPostBtn">新建文章</button>
    </div>
    <form id="postForm" style="display:none;margin-bottom:1.5rem;padding:1.5rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-surface)">
      <h3 style="margin:0 0 1rem">新建文章</h3>
      <div class="form-group"><label>标题</label><input name="title" required /></div>
      <div class="form-group"><label>摘要</label><input name="excerpt" required /></div>
      <div class="form-group"><label>正文 (支持 Markdown)</label><textarea name="content" rows="6" required></textarea></div>
      <div class="form-group"><label>封面渐变</label><input name="cover" placeholder="linear-gradient(...)" /></div>
      <div class="form-group"><label>分类</label><select name="categoryId" required>${cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}</select></div>
      <div class="form-group"><label>标签 (多选)</label><div style="display:flex;flex-wrap:wrap;gap:0.5rem">${tags.map(t => `<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.85rem;color:var(--ink-secondary);cursor:pointer"><input type="checkbox" name="tagIds" value="${t.id}" /> ${escapeHtml(t.name)}</label>`).join("")}</div></div>
      <div class="form-group"><label>状态</label><select name="status"><option value="draft">草稿</option><option value="published">已发布</option></select></div>
      <div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="featured" /> 精选</label></div>
      <div class="form-actions"><button type="button" class="button text" id="cancelPost">取消</button><button type="submit" class="button primary">保存</button></div>
    </form>
    <table class="admin-table">
      <thead><tr><th>标题</th><th>分类</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>
        ${posts.map((p) => `
          <tr>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(p.category?.name || "")}</td>
            <td><span class="badge badge-${p.status}">${p.status}</span></td>
            <td>${formatDate(p.updatedAt)}</td>
            <td class="admin-actions">
              <button data-edit="${p.id}">编辑</button>
              <button data-del="${p.id}">删除</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const form = document.getElementById("postForm");
  document.getElementById("newPostBtn")?.addEventListener("click", () => { form.style.display = "block"; });
  document.getElementById("cancelPost")?.addEventListener("click", () => { form.style.display = "none"; });
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tagIds = Array.from(e.target.querySelectorAll('input[name="tagIds"]:checked')).map(cb => cb.value);
    const body = {
      title: fd.get("title"),
      excerpt: fd.get("excerpt"),
      content: fd.get("content"),
      cover: fd.get("cover") || null,
      categoryId: fd.get("categoryId"),
      tagIds,
      status: fd.get("status"),
      featured: !!e.target.querySelector('input[name="featured"]').checked,
    };
    try {
      await api("/admin/posts", { method: "POST", token: getToken(), body });
      showToast("创建成功");
      renderAdmin();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  container.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(`/admin#posts/edit/${btn.dataset.edit}`);
    });
  });

  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定删除？")) return;
      try {
        await api(`/admin/posts/${btn.dataset.del}`, { method: "DELETE", token: getToken() });
        showToast("已删除");
        renderAdmin();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  });
}

async function renderAdminPostEditor(container, postId = null) {
  const cats = await api("/admin/categories", { token: getToken() });
  const tags = await api("/admin/tags", { token: getToken() });
  let post = null;
  if (postId) {
    post = await api(`/admin/posts/${postId}`, { token: getToken() });
  }

  container.innerHTML = `
    <form id="editorForm" style="padding:1.5rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-surface)">
      <h3 style="margin:0 0 1rem">${postId ? "编辑文章" : "新建文章"}</h3>
      <div class="form-group"><label>标题</label><input name="title" value="${escapeHtml(post?.title || "")}" required /></div>
      <div class="form-group"><label>摘要</label><input name="excerpt" value="${escapeHtml(post?.excerpt || "")}" required /></div>
      <div class="form-group"><label>正文 (支持 Markdown)</label><textarea name="content" rows="8" required>${escapeHtml(post?.content || "")}</textarea></div>
      <div class="form-group"><label>封面渐变</label><input name="cover" value="${escapeHtml(post?.cover || "")}" placeholder="linear-gradient(...)" /></div>
      <div class="form-group"><label>分类</label><select name="categoryId" required>${cats.map(c => `<option value="${c.id}" ${c.id === (post?.categoryId || "") ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
      <div class="form-group"><label>标签 (多选)</label><div style="display:flex;flex-wrap:wrap;gap:0.5rem">${tags.map(t => {
        const checked = post?.tags?.some(pt => pt.id === t.id) ? "checked" : "";
        return `<label style="display:flex;align-items:center;gap:0.3rem;font-size:0.85rem;color:var(--ink-secondary);cursor:pointer"><input type="checkbox" name="tagIds" value="${t.id}" ${checked} /> ${escapeHtml(t.name)}</label>`;
      }).join("")}</div></div>
      <div class="form-group"><label>状态</label><select name="status"><option value="draft" ${post?.status === "draft" ? "selected" : ""}>草稿</option><option value="published" ${post?.status === "published" ? "selected" : ""}>已发布</option></select></div>
      <div class="form-group"><label style="display:flex;align-items:center;gap:0.5rem"><input type="checkbox" name="featured" ${post?.featured ? "checked" : ""} /> 精选</label></div>
      <div class="form-actions"><a href="/admin#posts" data-link class="button text">返回</a><button type="submit" class="button primary">保存</button></div>
    </form>
  `;

  document.getElementById("editorForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tagIds = Array.from(e.target.querySelectorAll('input[name="tagIds"]:checked')).map(cb => cb.value);
    const body = {
      title: fd.get("title"),
      excerpt: fd.get("excerpt"),
      content: fd.get("content"),
      cover: fd.get("cover") || null,
      categoryId: fd.get("categoryId"),
      tagIds,
      status: fd.get("status"),
      featured: !!e.target.querySelector('input[name="featured"]').checked,
    };
    try {
      if (postId) {
        await api(`/admin/posts/${postId}`, { method: "PUT", token: getToken(), body });
        showToast("更新成功");
      } else {
        await api("/admin/posts", { method: "POST", token: getToken(), body });
        showToast("创建成功");
      }
      navigate("/admin#posts");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

async function renderAdminStats(container) {
  const stats = await api("/admin/stats", { token: getToken() });
  const maxViews = Math.max(...(stats.monthlyTrend || []).map(m => m.views), 1);
  const maxTopViews = Math.max(...(stats.topPosts || []).map(p => p.viewCount), 1);
  const colors = ["#38bdf8", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#fb923c"];

  const categoryTotal = (stats.categoryDist || []).reduce((sum, c) => sum + c.count, 0) || 1;
  let pieOffset = 0;
  const pieSlices = (stats.categoryDist || []).map((c, i) => {
    const pct = c.count / categoryTotal;
    const dash = `${pct * 100} ${100 - pct * 100}`;
    const offset = -pieOffset;
    pieOffset += pct * 100;
    return { dash, offset, color: colors[i % colors.length], name: c.name, count: c.count, pct: Math.round(pct * 100) };
  });

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalPosts || 0}</div>
        <div class="stat-label">文章总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalViews || 0}</div>
        <div class="stat-label">总阅读量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalComments || 0}</div>
        <div class="stat-label">评论总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.entries(stats.statusCounts || {}).map(([k,v])=>`${k}:${v}`).join(" / ")}</div>
        <div class="stat-label">状态分布</div>
      </div>
    </div>
    <div class="stats-charts">
      <div class="chart-card">
        <h3>阅读排行 TOP 5</h3>
        <div class="bar-chart">
          ${(stats.topPosts || []).map((p) => `
            <div class="bar-item">
              <div class="bar-track">
                <div class="bar-fill" style="width:${(p.viewCount / maxTopViews * 100).toFixed(1)}%"></div>
              </div>
              <div style="display:grid;gap:0.1rem;text-align:right">
                <div class="bar-value">${p.viewCount}</div>
                <div class="bar-label">${escapeHtml(p.title)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="chart-card">
        <h3>分类文章分布</h3>
        <div class="pie-chart">
          <svg class="pie-svg" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="16" fill="var(--bg-elevated)" />
            ${pieSlices.map((s) => `
              <circle cx="16" cy="16" r="8" fill="transparent" stroke="${s.color}" stroke-width="16"
                stroke-dasharray="${s.dash}" stroke-dashoffset="${s.offset}" transform="rotate(-90 16 16)" />
            `).join("")}
            <circle cx="16" cy="16" r="10" fill="var(--bg-surface)" />
          </svg>
          <div class="pie-legend">
            ${pieSlices.map((s) => `
              <div class="legend-item">
                <span class="legend-dot" style="background:${s.color}"></span>
                <span>${escapeHtml(s.name)} ${s.count} (${s.pct}%)</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="chart-card" style="margin-bottom:2rem">
      <h3>月度阅读趋势</h3>
      <div class="line-chart">
        <svg class="line-chart-svg" viewBox="0 0 600 160" preserveAspectRatio="none">
          ${stats.monthlyTrend?.length ? (() => {
            const points = stats.monthlyTrend.map((m, i) => {
              const x = (i / (stats.monthlyTrend.length - 1 || 1)) * 580 + 10;
              const y = 150 - (m.views / maxViews) * 130;
              return `${x},${y}`;
            }).join(" ");
            const area = stats.monthlyTrend.map((m, i) => {
              const x = (i / (stats.monthlyTrend.length - 1 || 1)) * 580 + 10;
              const y = 150 - (m.views / maxViews) * 130;
              return `${x},${y}`;
            }).join(" ") + ` 590,150 10,150`;
            return `
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polygon points="${area}" fill="url(#areaGrad)" />
              <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              ${stats.monthlyTrend.map((m, i) => {
                const x = (i / (stats.monthlyTrend.length - 1 || 1)) * 580 + 10;
                const y = 150 - (m.views / maxViews) * 130;
                return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)" /><text x="${x}" y="${y - 8}" text-anchor="middle" fill="var(--ink-muted)" font-size="10">${m.views}</text>`;
              }).join("")}
            `;
          })() : '<text x="300" y="80" text-anchor="middle" fill="var(--ink-muted)">暂无数据</text>'}
        </svg>
        <div style="display:flex;justify-content:space-between;margin-top:0.5rem;font-size:0.75rem;color:var(--ink-muted)">
          ${(stats.monthlyTrend || []).map((m) => `<span>${m.month}</span>`).join("")}
        </div>
      </div>
    </div>
  `;
}

async function renderAdminCategories(container) {
  const cats = await api("/admin/categories", { token: getToken() });
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="color:var(--ink-muted);font-size:0.9rem">共 ${cats.length} 个</span>
      <button class="button primary" id="newCatBtn">新建分类</button>
    </div>
    <form id="catForm" style="display:none;margin-bottom:1.5rem;padding:1.5rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-surface)">
      <h3 style="margin:0 0 1rem">新建分类</h3>
      <div class="form-group"><label>名称</label><input name="name" required /></div>
      <div class="form-group"><label>Slug</label><input name="slug" required /></div>
      <div class="form-group"><label>描述</label><input name="description" /></div>
      <div class="form-actions"><button type="button" class="button text" id="cancelCat">取消</button><button type="submit" class="button primary">保存</button></div>
    </form>
    <table class="admin-table">
      <thead><tr><th>名称</th><th>Slug</th><th>可见</th><th>操作</th></tr></thead>
      <tbody>
        ${cats.map((c) => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td>${escapeHtml(c.slug)}</td>
            <td>${c.visible ? "是" : "否"}</td>
            <td class="admin-actions"><button data-del="${c.id}">删除</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const form = document.getElementById("catForm");
  document.getElementById("newCatBtn")?.addEventListener("click", () => { form.style.display = "block"; });
  document.getElementById("cancelCat")?.addEventListener("click", () => { form.style.display = "none"; });
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api("/admin/categories", { method: "POST", token: getToken(), body: { name: fd.get("name"), slug: fd.get("slug"), description: fd.get("description") || null } });
      showToast("创建成功");
      renderAdmin();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定删除？")) return;
      try {
        await api(`/admin/categories/${btn.dataset.del}`, { method: "DELETE", token: getToken() });
        showToast("已删除");
        renderAdmin();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  });
}

async function renderAdminTags(container) {
  const tags = await api("/admin/tags", { token: getToken() });
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <span style="color:var(--ink-muted);font-size:0.9rem">共 ${tags.length} 个</span>
      <button class="button primary" id="newTagBtn">新建标签</button>
    </div>
    <form id="tagForm" style="display:none;margin-bottom:1.5rem;padding:1.5rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg-surface)">
      <h3 style="margin:0 0 1rem">新建标签</h3>
      <div class="form-group"><label>名称</label><input name="name" required /></div>
      <div class="form-group"><label>Slug</label><input name="slug" required /></div>
      <div class="form-group"><label>颜色</label><input name="color" placeholder="#38bdf8" /></div>
      <div class="form-actions"><button type="button" class="button text" id="cancelTag">取消</button><button type="submit" class="button primary">保存</button></div>
    </form>
    <table class="admin-table">
      <thead><tr><th>名称</th><th>Slug</th><th>文章数</th><th>操作</th></tr></thead>
      <tbody>
        ${tags.map((t) => `
          <tr>
            <td>${escapeHtml(t.name)}</td>
            <td>${escapeHtml(t.slug)}</td>
            <td>${t.postCount || 0}</td>
            <td class="admin-actions"><button data-del="${t.id}">删除</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const form = document.getElementById("tagForm");
  document.getElementById("newTagBtn")?.addEventListener("click", () => { form.style.display = "block"; });
  document.getElementById("cancelTag")?.addEventListener("click", () => { form.style.display = "none"; });
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api("/admin/tags", { method: "POST", token: getToken(), body: { name: fd.get("name"), slug: fd.get("slug"), color: fd.get("color") || null } });
      showToast("创建成功");
      renderAdmin();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  container.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("确定删除？")) return;
      try {
        await api(`/admin/tags/${btn.dataset.del}`, { method: "DELETE", token: getToken() });
        showToast("已删除");
        renderAdmin();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  });
}

async function renderAdminComments(container) {
  const res = await api("/admin/comments?pageSize=50", { token: getToken() });
  const comments = res.data || [];
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>文章</th><th>作者</th><th>内容</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
      <tbody>
        ${comments.map((c) => `
          <tr>
            <td>${escapeHtml(c.post?.title || "")}</td>
            <td>${escapeHtml(c.author)}</td>
            <td>${escapeHtml(c.content).substring(0, 40)}...</td>
            <td><span class="badge badge-${c.status === "approved" ? "published" : "draft"}">${c.status}</span></td>
            <td>${formatDate(c.createdAt)}</td>
            <td class="admin-actions">
              ${c.status !== "approved" ? `<button data-approve="${c.id}">通过</button>` : ""}
              <button data-del="${c.id}">删除</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await api(`/admin/comments/${btn.dataset.approve}/approve`, { method: "PUT", token: getToken() });
        showToast("已通过");
        renderAdmin();
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  });
}

async function renderAdminSettings(container) {
  const settings = await api("/admin/site-settings", { token: getToken() });
  container.innerHTML = `
    <form id="settingsForm">
      <div class="form-group"><label>站点标题</label><input name="title" value="${escapeHtml(settings.title || "")}" required /></div>
      <div class="form-group"><label>副标题</label><input name="subtitle" value="${escapeHtml(settings.subtitle || "")}" /></div>
      <div class="form-group"><label>作者名</label><input name="authorName" value="${escapeHtml(settings.authorName || "")}" required /></div>
      <div class="form-group"><label>作者简介</label><textarea name="authorBio">${escapeHtml(settings.authorBio || "")}</textarea></div>
      <div class="form-actions"><button type="submit" class="button primary">保存</button></div>
    </form>
  `;

  document.getElementById("settingsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      id: settings.id,
      title: fd.get("title"),
      subtitle: fd.get("subtitle") || null,
      authorName: fd.get("authorName"),
      authorBio: fd.get("authorBio") || null,
    };
    try {
      await api("/admin/site-settings", { method: "PUT", token: getToken(), body });
      showToast("保存成功");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ===== Router =====
function render() {
  const path = location.pathname;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    const isHome = href === "/" && path === "/";
    const isSection = href !== "/" && path.startsWith(href);
    link.classList.toggle("active", isHome || isSection);
  });
  siteNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
  progressBar.style.width = "0%";

  if (path === "/") renderHome();
  else if (path === "/posts") renderPosts();
  else if (path.startsWith("/post/")) renderPostDetail(path.split("/post/").pop());
  else if (path === "/categories") renderCategories();
  else if (path === "/archives") renderArchives();
  else if (path === "/about") renderAbout();
  else if (path === "/admin") renderAdmin();
  else renderNotFound();

  app.focus({ preventScroll: true });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}${url.hash}`);
});

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

window.addEventListener("popstate", render);
render();
