package main

import (
	"log"
	"net/http"
	"time"

	"blog-backend/internal/config"
	"blog-backend/internal/handler"
	"blog-backend/internal/middleware"
	"blog-backend/internal/model"
	"blog-backend/internal/repository"
	"blog-backend/internal/service"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := gorm.Open(sqlite.Open(cfg.DatabaseDSN), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}

	// Auto migrate
	if err := db.AutoMigrate(
		&model.Post{},
		&model.Category{},
		&model.Tag{},
		&model.SiteSettings{},
		&model.User{},
		&model.Comment{},
	); err != nil {
		log.Fatal("failed to migrate:", err)
	}

	repo := repository.New(db)
	svc := service.New(repo, cfg.JWTSecret)
	h := handler.New(svc)

	seedData(db, svc)

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(corsMiddleware())

	h.Register(r, middleware.Auth(svc))

	srv := &http.Server{
		Addr:    cfg.HTTPAddr,
		Handler: r,
	}

	log.Println("Server running on", cfg.HTTPAddr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("server failed:", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func seedData(db *gorm.DB, svc *service.Service) {
	var count int64
	db.Model(&model.User{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("Seeding initial data...")

	// Create admin user
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := &model.User{
		ID:       "user_admin_001",
		Name:     "Admin",
		Email:    "admin@blog.local",
		Password: string(hash),
		Role:     "admin",
	}
	if err := db.Create(admin).Error; err != nil {
		log.Println("failed to create admin:", err)
	}

	// Create site settings
	settings := &model.SiteSettings{
		Title:      "From Zero Blog",
		Subtitle:   strPtr("Engineering Notes & Project Recaps"),
		AuthorName: "Admin",
		AuthorBio:  strPtr("记录可复用的工程实现过程。把产品判断和技术取舍写清楚。"),
	}
	if err := db.Create(settings).Error; err != nil {
		log.Println("failed to create settings:", err)
	}

	// Create categories
	cats := []model.Category{
		{ID: "cat_go", Slug: "golang", Name: "Go", Description: strPtr("Go 语言相关"), Visible: true},
		{ID: "cat_rust", Slug: "rust", Name: "Rust", Description: strPtr("Rust 语言相关"), Visible: true},
		{ID: "cat_frontend", Slug: "frontend", Name: "前端", Description: strPtr("前端技术与 UI 设计"), Visible: true},
		{ID: "cat_arch", Slug: "architecture", Name: "架构", Description: strPtr("系统架构与设计模式"), Visible: true},
		{ID: "cat_devops", Slug: "devops", Name: "DevOps", Description: strPtr("运维与部署"), Visible: true},
	}
	for _, c := range cats {
		c.CreatedAt = time.Now()
		c.UpdatedAt = time.Now()
		db.Create(&c)
	}

	// Create tags
	tags := []model.Tag{
		{ID: "tag_perf", Slug: "performance", Name: "性能优化", Color: strPtr("#e76f51")},
		{ID: "tag_api", Slug: "api-design", Name: "API 设计", Color: strPtr("#2a9d8f")},
		{ID: "tag_db", Slug: "database", Name: "数据库", Color: strPtr("#264653")},
		{ID: "tag_css", Slug: "css", Name: "CSS", Color: strPtr("#f4a261")},
		{ID: "tag_js", Slug: "javascript", Name: "JavaScript", Color: strPtr("#e9c46a")},
		{ID: "tag_wasm", Slug: "webassembly", Name: "WebAssembly", Color: strPtr("#8ab17d")},
		{ID: "tag_ci", Slug: "ci-cd", Name: "CI/CD", Color: strPtr("#6d597a")},
	}
	for _, t := range tags {
		t.CreatedAt = time.Now()
		t.UpdatedAt = time.Now()
		db.Create(&t)
	}

	// Create sample posts
	posts := []model.Post{
		{
			ID:         "post_001",
			Slug:       "building-blog-backend-with-go",
			Title:      "用 Go 构建高性能博客后端",
			Excerpt:    "从选型到实现，记录一个轻量博客后端的完整构建过程。",
			Content:    "## 为什么选 Go\n\nGo 语言以简洁和高效著称，非常适合构建 API 服务。\n\n## 技术栈\n\n- Gin 框架\n- GORM + SQLite\n- JWT 认证\n\n## 核心设计\n\n分层架构：Handler -> Service -> Repository -> Model。",
			Cover:      strPtr("linear-gradient(135deg, #00b4db 0%, #0083b0 100%)"),
			CategoryID: "cat_go",
			Status:     "published",
			Featured:   true,
			ViewCount:  128,
		},
		{
			ID:         "post_002",
			Slug:       "rust-memory-safety",
			Title:      "Rust 内存安全机制深度解析",
			Excerpt:    "所有权、借用和生命周期如何共同保证内存安全。",
			Content:    "## 所有权系统\n\nRust 的核心创新在于编译期内存管理。\n\n## 借用检查器\n\n通过 &T 和 &mut T 区分可变与不可变引用。",
			Cover:      strPtr("linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"),
			CategoryID: "cat_rust",
			Status:     "published",
			Featured:   true,
			ViewCount:  96,
		},
		{
			ID:         "post_003",
			Slug:       "modern-css-dark-mode",
			Title:      "现代 CSS 暗色模式实现指南",
			Excerpt:    "使用 CSS 变量和 color-scheme 打造优雅的暗色主题。",
			Content:    "## CSS 变量策略\n\n定义一套语义化变量，通过 data-theme 切换。\n\n## 过渡动画\n\n使用 transition 让主题切换更平滑。",
			Cover:      strPtr("linear-gradient(135deg, #667eea 0%, #764ba2 100%)"),
			CategoryID: "cat_frontend",
			Status:     "published",
			Featured:   false,
			ViewCount:  72,
		},
		{
			ID:         "post_004",
			Slug:       "microservices-tradeoffs",
			Title:      "微服务架构的权衡与选择",
			Excerpt:    "不是银弹：什么时候该用微服务，什么时候应该坚守单体。",
			Content:    "## 团队规模决定架构\n\n康威定律：组织结构决定系统架构。\n\n## 拆分的时机\n\n- 部署频率差异大\n- 技术栈异构需求\n- 团队规模 > 20 人",
			Cover:      strPtr("linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"),
			CategoryID: "cat_arch",
			Status:     "published",
			Featured:   true,
			ViewCount:  64,
		},
		{
			ID:         "post_005",
			Slug:       "github-actions-ci-cd",
			Title:      "GitHub Actions 自动化部署实践",
			Excerpt:    "从零搭建 CI/CD 流水线，实现自动化测试与部署。",
			Content:    "## Workflow 设计\n\n- 触发条件：push 到 main 分支\n- 测试阶段：go test ./...\n- 构建阶段：docker build\n- 部署阶段：ssh + docker-compose",
			Cover:      strPtr("linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)"),
			CategoryID: "cat_devops",
			Status:     "published",
			Featured:   false,
			ViewCount:  45,
		},
		{
			ID:         "post_006",
			Slug:       "sqlite-performance-tips",
			Title:      "SQLite 性能优化实战",
			Excerpt:    "在单文件数据库上榨取极致性能的技巧与陷阱。",
			Content:    "## WAL 模式\n\nPRAGMA journal_mode=WAL; 大幅提升并发读取性能。\n\n## 索引策略\n\n- 主键自动索引\n- 外键显式索引\n- 搜索字段复合索引",
			Cover:      strPtr("linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)"),
			CategoryID: "cat_devops",
			Status:     "published",
			Featured:   false,
			ViewCount:  38,
		},
	}

	now := time.Now()
	for i, p := range posts {
		p.CreatedAt = now.AddDate(0, 0, -i*7)
		p.UpdatedAt = p.CreatedAt
		p.PublishedAt = &p.CreatedAt
		if err := db.Create(&p).Error; err != nil {
			log.Println("failed to create post:", err)
		}
	}

	// Associate tags
	tagMap := map[string][]string{
		"post_001": {"tag_perf", "tag_api"},
		"post_002": {"tag_perf"},
		"post_003": {"tag_css", "tag_js"},
		"post_004": {"tag_api", "tag_ci"},
		"post_005": {"tag_ci"},
		"post_006": {"tag_db", "tag_perf"},
	}
	for pid, tids := range tagMap {
		for _, tid := range tids {
			db.Exec("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", pid, tid)
		}
	}

	log.Println("Seed data complete.")
}

func strPtr(s string) *string {
	return &s
}
