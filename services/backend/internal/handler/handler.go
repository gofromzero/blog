package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"blog-backend/internal/model"
	"blog-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(r *gin.Engine, authMW gin.HandlerFunc) {
	api := r.Group("/api")
	{
		api.GET("/posts", h.ListPosts)
		api.GET("/posts/:slug", h.GetPost)
		api.GET("/categories", h.ListCategories)
		api.GET("/tags", h.ListTags)
		api.GET("/archives", h.GetArchives)
		api.GET("/site-settings", h.GetSiteSettings)
		api.GET("/search", h.SearchPosts)
		api.GET("/posts/:slug/comments", h.ListComments)
		api.POST("/posts/:slug/comments", h.CreateComment)
		api.GET("/archives/:year/:month", h.GetPostsByArchive)
		api.GET("/rss", h.GetRSS)
	}

	admin := api.Group("/admin")
	{
		admin.POST("/auth/login", h.AdminLogin)
		admin.GET("/auth/me", authMW, h.AdminMe)
		admin.POST("/auth/logout", authMW, h.AdminLogout)

		admin.GET("/posts", authMW, h.ListAdminPosts)
		admin.POST("/posts", authMW, h.CreatePost)
		admin.GET("/posts/:id", authMW, h.GetAdminPost)
		admin.PUT("/posts/:id", authMW, h.UpdatePost)
		admin.DELETE("/posts/:id", authMW, h.DeletePost)

		admin.GET("/categories", authMW, h.ListAdminCategories)
		admin.POST("/categories", authMW, h.CreateCategory)
		admin.PUT("/categories/:id", authMW, h.UpdateCategory)

		admin.GET("/tags", authMW, h.ListAdminTags)
		admin.POST("/tags", authMW, h.CreateTag)
		admin.PUT("/tags/:id", authMW, h.UpdateTag)
		admin.DELETE("/tags/:id", authMW, h.DeleteTag)

		admin.GET("/site-settings", authMW, h.GetAdminSiteSettings)
		admin.PUT("/site-settings", authMW, h.UpdateSiteSettings)

		admin.GET("/comments", authMW, h.ListAdminComments)
		admin.PUT("/comments/:id/approve", authMW, h.ApproveComment)
		admin.DELETE("/comments/:id", authMW, h.DeleteComment)

		admin.GET("/stats", authMW, h.GetStats)
	}
}

// Public

func (h *Handler) ListPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	category := c.Query("category")
	tag := c.Query("tag")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	posts, total, err := h.svc.ListPosts(keyword, category, tag, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     posts,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func (h *Handler) GetPost(c *gin.Context) {
	slug := c.Param("slug")
	post, err := h.svc.GetPostBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	c.JSON(http.StatusOK, post)
}

func (h *Handler) ListCategories(c *gin.Context) {
	cats, err := h.svc.ListCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cats)
}

func (h *Handler) ListTags(c *gin.Context) {
	tags, err := h.svc.ListTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

func (h *Handler) GetArchives(c *gin.Context) {
	archives, err := h.svc.GetArchives()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, archives)
}

func (h *Handler) GetSiteSettings(c *gin.Context) {
	settings, err := h.svc.GetSiteSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *Handler) SearchPosts(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing query"})
		return
	}
	posts, err := h.svc.SearchPosts(q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}

func (h *Handler) ListComments(c *gin.Context) {
	slug := c.Param("slug")
	post, err := h.svc.GetPostBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	comments, err := h.svc.ListCommentsByPost(post.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comments)
}

func (h *Handler) CreateComment(c *gin.Context) {
	slug := c.Param("slug")
	post, err := h.svc.GetPostBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}

	var req struct {
		Author  string `json:"author" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment := &model.Comment{
		PostID:  post.ID,
		Author:  req.Author,
		Email:   req.Email,
		Content: req.Content,
	}
	if err := h.svc.CreateComment(comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, comment)
}

func (h *Handler) GetPostsByArchive(c *gin.Context) {
	year, _ := strconv.Atoi(c.Param("year"))
	month, _ := strconv.Atoi(c.Param("month"))
	posts, err := h.svc.GetPostsByArchive(year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, posts)
}

// Admin Auth

func (h *Handler) AdminLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *Handler) AdminMe(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *Handler) AdminLogout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// Admin Posts

func (h *Handler) ListAdminPosts(c *gin.Context) {
	keyword := c.Query("keyword")
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	posts, total, err := h.svc.ListAllPosts(keyword, status, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":     posts,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func (h *Handler) CreatePost(c *gin.Context) {
	var req struct {
		model.Post
		TagIDs []string `json:"tagIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreatePost(&req.Post, req.TagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req.Post)
}

func (h *Handler) GetAdminPost(c *gin.Context) {
	id := c.Param("id")
	post, err := h.svc.GetPostByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}
	c.JSON(http.StatusOK, post)
}

func (h *Handler) UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		model.Post
		TagIDs []string `json:"tagIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.UpdatePost(id, &req.Post, req.TagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeletePost(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeletePost(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Admin Categories

func (h *Handler) ListAdminCategories(c *gin.Context) {
	cats, err := h.svc.ListAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cats)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var cat model.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateCategory(&cat); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var cat model.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cat.ID = id
	if err := h.svc.UpdateCategory(&cat); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// Admin Tags

func (h *Handler) ListAdminTags(c *gin.Context) {
	tags, err := h.svc.ListTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tags)
}

func (h *Handler) CreateTag(c *gin.Context) {
	var tag model.Tag
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.CreateTag(&tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tag)
}

func (h *Handler) UpdateTag(c *gin.Context) {
	id := c.Param("id")
	var tag model.Tag
	if err := c.ShouldBindJSON(&tag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tag.ID = id
	if err := h.svc.UpdateTag(&tag); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *Handler) DeleteTag(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteTag(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Admin SiteSettings

func (h *Handler) GetAdminSiteSettings(c *gin.Context) {
	settings, err := h.svc.GetSiteSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *Handler) UpdateSiteSettings(c *gin.Context) {
	var settings model.SiteSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.SaveSiteSettings(&settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

// Admin Comments

func (h *Handler) ListAdminComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	comments, total, err := h.svc.ListAllComments(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data":     comments,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

func (h *Handler) ApproveComment(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.ApproveComment(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

func (h *Handler) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteComment(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetRSS(c *gin.Context) {
	settings, err := h.svc.GetSiteSettings()
	if err != nil {
		c.String(http.StatusInternalServerError, "Error")
		return
	}
	posts, _, err := h.svc.ListPosts("", "", "", 1, 20)
	if err != nil {
		c.String(http.StatusInternalServerError, "Error")
		return
	}

	c.Header("Content-Type", "application/rss+xml; charset=utf-8")
	subtitle := ""
	if settings.Subtitle != nil {
		subtitle = *settings.Subtitle
	}
	xml := `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>` + escapeXml(settings.Title) + `</title>
  <link>http://localhost:4173</link>
  <description>` + escapeXml(subtitle) + `</description>
  <language>zh-CN</language>
`
	for _, p := range posts {
		xml += `  <item>
    <title>` + escapeXml(p.Title) + `</title>
    <link>http://localhost:4173/post/` + escapeXml(p.Slug) + `</link>
    <guid>http://localhost:4173/post/` + escapeXml(p.Slug) + `</guid>
    <pubDate>` + p.PublishedAt.Format(time.RFC1123) + `</pubDate>
    <description>` + escapeXml(p.Excerpt) + `</description>
  </item>
`
	}
	xml += `</channel>
</rss>`
	c.String(http.StatusOK, xml)
}

func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.svc.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func escapeXml(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	s = strings.ReplaceAll(s, "'", "&apos;")
	return s
}
