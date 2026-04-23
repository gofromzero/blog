import { posts, profile } from "./content.js";

const app = document.querySelector("#app");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

const formatDate = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" });
const categories = [...new Set(posts.map((post) => post.category))];
const tags = [...new Set(posts.flatMap((post) => post.tags))];

function navigate(path) {
  history.pushState({}, "", path);
  render();
}

function setTitle(title) {
  document.title = title ? `${title} · From Zero Blog` : "From Zero Blog";
}

function postCard(post) {
  return `
    <article class="post-card">
      <a class="card-cover" style="background:${post.cover}" href="/post/${post.id}" data-link aria-label="阅读 ${post.title}"></a>
      <div class="card-body">
        <div class="meta-row">
          <span>${post.category}</span>
          <span>${formatDate.format(new Date(post.date))}</span>
          <span>${post.readTime}</span>
        </div>
        <h3><a href="/post/${post.id}" data-link>${post.title}</a></h3>
        <p>${post.excerpt}</p>
        <div class="tag-row">
          ${post.tags.map((tag) => `<a href="/categories?tag=${encodeURIComponent(tag)}" data-link>#${tag}</a>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const featured = posts.filter((post) => post.featured);
  const latest = posts.slice(0, 3);
  setTitle("");
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Blog frontend redesign</p>
        <h1>From Zero</h1>
        <p>${profile.title}。面向真实阅读、筛选和跳转场景重建的前台界面。</p>
        <div class="hero-actions">
          <a class="button primary" href="/posts" data-link>浏览文章</a>
          <a class="button secondary" href="/categories" data-link>按主题查找</a>
        </div>
      </div>
      <aside class="hero-panel" aria-label="站点概览">
        <strong>${posts.length}</strong>
        <span>篇内容</span>
        <strong>${categories.length}</strong>
        <span>个分类</span>
        <strong>${tags.length}</strong>
        <span>个标签</span>
      </aside>
    </section>
    <section class="section">
      <div class="section-heading">
        <p class="eyebrow">精选阅读</p>
        <h2>先从这些文章开始</h2>
      </div>
      <div class="featured-grid">${featured.map(postCard).join("")}</div>
    </section>
    <section class="section split-section">
      <div>
        <p class="eyebrow">最近更新</p>
        <h2>新的工程记录</h2>
      </div>
      <div class="compact-list">
        ${latest.map((post) => `
          <a href="/post/${post.id}" data-link>
            <span>${post.title}</span>
            <small>${formatDate.format(new Date(post.date))}</small>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function getFilteredPosts(params) {
  const q = (params.get("q") || "").trim().toLowerCase();
  const category = params.get("category") || "全部";
  const tag = params.get("tag") || "";

  return posts.filter((post) => {
    const matchesText = !q || [post.title, post.excerpt, post.category, ...post.tags].join(" ").toLowerCase().includes(q);
    const matchesCategory = category === "全部" || post.category === category;
    const matchesTag = !tag || post.tags.includes(tag);
    return matchesText && matchesCategory && matchesTag;
  });
}

function renderPosts() {
  const params = new URLSearchParams(location.search);
  const filtered = getFilteredPosts(params);
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
        <input id="searchInput" type="search" value="${params.get("q") || ""}" placeholder="标题、摘要、标签" />
      </label>
      <label>
        <span>分类</span>
        <select id="categorySelect">
          ${["全部", ...categories].map((item) => `<option value="${item}" ${item === (params.get("category") || "全部") ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </label>
      <button class="button primary" type="button" id="applySearch">筛选</button>
      ${params.get("tag") ? `<button class="button text" type="button" id="clearTag">清除标签 #${params.get("tag")}</button>` : ""}
    </section>
    <section class="post-grid" aria-live="polite">
      ${filtered.length ? filtered.map(postCard).join("") : `<div class="empty-state"><h2>没有匹配内容</h2><p>换一个关键词或清除筛选条件再试。</p></div>`}
    </section>
  `;

  const applySearch = () => {
    const value = document.querySelector("#searchInput").value.trim();
    if (value) params.set("q", value);
    else params.delete("q");
    navigate(`/posts?${params.toString()}`);
  };
  document.querySelector("#applySearch").addEventListener("click", applySearch);
  document.querySelector("#searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") applySearch();
  });
  document.querySelector("#categorySelect").addEventListener("change", (event) => {
    if (event.target.value === "全部") params.delete("category");
    else params.set("category", event.target.value);
    navigate(`/posts?${params.toString()}`);
  });
  document.querySelector("#clearTag")?.addEventListener("click", () => {
    params.delete("tag");
    navigate(`/posts?${params.toString()}`);
  });
}

function renderPostDetail(id) {
  const post = posts.find((item) => item.id === id);
  if (!post) return renderNotFound();
  const related = posts.filter((item) => item.id !== id && (item.category === post.category || item.tags.some((tag) => post.tags.includes(tag)))).slice(0, 2);
  setTitle(post.title);
  app.innerHTML = `
    <article class="article">
      <a class="back-link" href="/posts" data-link>返回文章列表</a>
      <div class="article-cover" style="background:${post.cover}"></div>
      <div class="article-head">
        <div class="meta-row">
          <span>${post.category}</span>
          <span>${formatDate.format(new Date(post.date))}</span>
          <span>${post.readTime}</span>
        </div>
        <h1>${post.title}</h1>
        <p>${post.excerpt}</p>
        <div class="tag-row">${post.tags.map((tag) => `<a href="/categories?tag=${encodeURIComponent(tag)}" data-link>#${tag}</a>`).join("")}</div>
      </div>
      <div class="article-body">
        ${post.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
      </div>
    </article>
    <section class="section">
      <div class="section-heading">
        <p class="eyebrow">Related</p>
        <h2>继续阅读</h2>
      </div>
      <div class="featured-grid">${related.map(postCard).join("") || "<p>暂无相关文章。</p>"}</div>
    </section>
  `;
}

function renderCategories() {
  const params = new URLSearchParams(location.search);
  const activeTag = params.get("tag");
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
        ${categories.map((category) => `
          <a class="topic-item" href="/posts?category=${encodeURIComponent(category)}" data-link>
            <span>${category}</span>
            <strong>${posts.filter((post) => post.category === category).length}</strong>
          </a>
        `).join("")}
      </div>
      <div class="topic-column">
        <h2>标签</h2>
        <div class="tag-cloud">
          ${tags.map((tag) => `<a class="${activeTag === tag ? "active" : ""}" href="/categories?tag=${encodeURIComponent(tag)}" data-link>#${tag}</a>`).join("")}
        </div>
      </div>
    </section>
    ${activeTag ? `<section class="section"><div class="section-heading"><p class="eyebrow">#${activeTag}</p><h2>标签文章</h2></div><div class="post-grid">${posts.filter((post) => post.tags.includes(activeTag)).map(postCard).join("")}</div></section>` : ""}
  `;
}

function renderArchives() {
  const grouped = posts.reduce((acc, post) => {
    const year = new Date(post.date).getFullYear();
    acc[year] = acc[year] || [];
    acc[year].push(post);
    return acc;
  }, {});
  setTitle("归档");
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
            <a href="/post/${post.id}" data-link>
              <time>${post.date}</time>
              <span>${post.title}</span>
              <small>${post.category}</small>
            </a>
          `).join("")}
        </div>
      `).join("")}
    </section>
  `;
}

function renderAbout() {
  setTitle("关于");
  app.innerHTML = `
    <section class="about-page">
      <div>
        <p class="eyebrow">About</p>
        <h1>${profile.name}</h1>
        <p>${profile.bio}</p>
        <div class="hero-actions">
          ${profile.links.map((link) => `<a class="button secondary" href="${link.href}" ${link.href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : "data-link"}>${link.label}</a>`).join("")}
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
}

function renderNotFound() {
  setTitle("404");
  app.innerHTML = `
    <section class="not-found">
      <p class="eyebrow">404</p>
      <h1>页面不存在</h1>
      <p>这个地址没有匹配到前台页面，可以返回首页或文章列表继续浏览。</p>
      <div class="hero-actions">
        <a class="button primary" href="/" data-link>回到首页</a>
        <a class="button secondary" href="/posts" data-link>查看文章</a>
      </div>
    </section>
  `;
}

function render() {
  const path = location.pathname;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const isHome = link.getAttribute("href") === "/" && path === "/";
    const isSection = link.getAttribute("href") !== "/" && path.startsWith(link.getAttribute("href"));
    link.classList.toggle("active", isHome || isSection);
  });
  siteNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");

  if (path === "/") renderHome();
  else if (path === "/posts") renderPosts();
  else if (path.startsWith("/post/")) renderPostDetail(path.split("/").pop());
  else if (path === "/categories") renderCategories();
  else if (path === "/archives") renderArchives();
  else if (path === "/about") renderAbout();
  else renderNotFound();

  app.focus({ preventScroll: true });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-link]");
  if (!link) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin) return;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}`);
});

navToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

window.addEventListener("popstate", render);
render();
