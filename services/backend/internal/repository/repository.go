package repository

import (
	"fmt"
	"strings"

	"blog-backend/internal/model"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// Post

func (r *Repository) ListPosts(keyword, category, tag string, page, pageSize int) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	query := r.db.Model(&model.Post{}).Where("status = ?", "published")

	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR excerpt LIKE ? OR content LIKE ?", like, like, like)
	}
	if category != "" {
		query = query.Where("category_id = ?", category)
	}
	if tag != "" {
		query = query.Joins("JOIN post_tags ON post_tags.post_id = posts.id").
			Joins("JOIN tags ON tags.id = post_tags.tag_id").
			Where("tags.slug = ?", tag)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("Category").Preload("Tags").
		Order("published_at DESC, created_at DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).
		Find(&posts).Error

	return posts, total, err
}

func (r *Repository) GetPostBySlug(slug string) (*model.Post, error) {
	var post model.Post
	err := r.db.Where("slug = ? AND status = ?", slug, "published").
		Preload("Category").Preload("Tags").
		First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *Repository) GetPostByID(id string) (*model.Post, error) {
	var post model.Post
	err := r.db.Where("id = ?", id).
		Preload("Category").Preload("Tags").
		First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *Repository) IncrementViewCount(id string) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *Repository) CreatePost(post *model.Post) error {
	return r.db.Create(post).Error
}

func (r *Repository) UpdatePost(post *model.Post) error {
	return r.db.Save(post).Error
}

func (r *Repository) DeletePost(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Post{}).Error
}

func (r *Repository) ListAllPosts(keyword, status string, page, pageSize int) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	query := r.db.Model(&model.Post{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("title LIKE ? OR excerpt LIKE ?", like, like)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Preload("Category").Preload("Tags").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).
		Find(&posts).Error

	return posts, total, err
}

// Category

func (r *Repository) ListCategories() ([]model.Category, error) {
	var cats []model.Category
	err := r.db.Where("visible = ?", true).Order("name").Find(&cats).Error
	if err != nil {
		return nil, err
	}
	for i := range cats {
		var count int64
		r.db.Model(&model.Post{}).Where("category_id = ? AND status = ?", cats[i].ID, "published").Count(&count)
		cats[i].PostCount = count
	}
	return cats, nil
}

func (r *Repository) ListAllCategories() ([]model.Category, error) {
	var cats []model.Category
	err := r.db.Order("name").Find(&cats).Error
	return cats, err
}

func (r *Repository) GetCategory(id string) (*model.Category, error) {
	var cat model.Category
	err := r.db.First(&cat, "id = ?", id).Error
	return &cat, err
}

func (r *Repository) CreateCategory(cat *model.Category) error {
	return r.db.Create(cat).Error
}

func (r *Repository) UpdateCategory(cat *model.Category) error {
	return r.db.Save(cat).Error
}

func (r *Repository) DeleteCategory(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Category{}).Error
}

// Tag

func (r *Repository) ListTags() ([]model.Tag, error) {
	var tags []model.Tag
	err := r.db.Order("name").Find(&tags).Error
	if err != nil {
		return nil, err
	}
	for i := range tags {
		var count int64
		r.db.Model(&model.Post{}).Joins("JOIN post_tags ON post_tags.post_id = posts.id").
			Where("post_tags.tag_id = ? AND posts.status = ?", tags[i].ID, "published").Count(&count)
		tags[i].PostCount = count
	}
	return tags, nil
}

func (r *Repository) GetTag(id string) (*model.Tag, error) {
	var tag model.Tag
	err := r.db.First(&tag, "id = ?", id).Error
	return &tag, err
}

func (r *Repository) CreateTag(tag *model.Tag) error {
	return r.db.Create(tag).Error
}

func (r *Repository) UpdateTag(tag *model.Tag) error {
	return r.db.Save(tag).Error
}

func (r *Repository) DeleteTag(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Tag{}).Error
}

// SiteSettings

func (r *Repository) GetSiteSettings() (*model.SiteSettings, error) {
	var settings model.SiteSettings
	err := r.db.First(&settings).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &model.SiteSettings{Title: "From Zero Blog", AuthorName: "Admin"}, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *Repository) SaveSiteSettings(settings *model.SiteSettings) error {
	if settings.ID == 0 {
		return r.db.Create(settings).Error
	}
	return r.db.Save(settings).Error
}

// User

func (r *Repository) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *Repository) GetUserByID(id string) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, "id = ?", id).Error
	return &user, err
}

func (r *Repository) CreateUser(user *model.User) error {
	return r.db.Create(user).Error
}

// Comment

func (r *Repository) ListCommentsByPost(postID string) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.Where("post_id = ? AND status = ?", postID, "approved").
		Order("created_at DESC").Find(&comments).Error
	return comments, err
}

func (r *Repository) CreateComment(comment *model.Comment) error {
	return r.db.Create(comment).Error
}

func (r *Repository) ListAllComments(page, pageSize int) ([]model.Comment, int64, error) {
	var comments []model.Comment
	var total int64

	query := r.db.Model(&model.Comment{})
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := query.Preload("Post").Order("created_at DESC").
		Offset((page - 1) * pageSize).Limit(pageSize).
		Find(&comments).Error
	return comments, total, err
}

func (r *Repository) UpdateCommentStatus(id, status string) error {
	return r.db.Model(&model.Comment{}).Where("id = ?", id).Update("status", status).Error
}

func (r *Repository) DeleteComment(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Comment{}).Error
}

// Archives

type ArchiveGroup struct {
	Year  int
	Month int
	Count int64
}

func (r *Repository) GetArchives() ([]map[string]interface{}, error) {
	rows, err := r.db.Model(&model.Post{}).
		Select("strftime('%Y', published_at) as year, strftime('%m', published_at) as month, count(*) as count").
		Where("status = ? AND published_at IS NOT NULL", "published").
		Group("year, month").
		Order("year DESC, month DESC").
		Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []map[string]interface{}
	for rows.Next() {
		var year, month int
		var count int64
		if err := rows.Scan(&year, &month, &count); err != nil {
			continue
		}
		result = append(result, map[string]interface{}{
			"year":  year,
			"month": month,
			"count": count,
		})
	}
	return result, nil
}

func (r *Repository) SearchPosts(keyword string) ([]model.Post, error) {
	var posts []model.Post
	like := "%" + strings.ToLower(keyword) + "%"
	err := r.db.Where("status = ? AND (LOWER(title) LIKE ? OR LOWER(excerpt) LIKE ? OR LOWER(content) LIKE ?)",
		"published", like, like, like).
		Preload("Category").Preload("Tags").
		Order("published_at DESC").Limit(20).
		Find(&posts).Error
	return posts, err
}

func (r *Repository) SetPostTags(postID string, tagIDs []string) error {
	if err := r.db.Where("post_id = ?", postID).Delete(&struct {
		PostID string `gorm:"column:post_id"`
		TagID  string `gorm:"column:tag_id"`
	}{}).Error; err != nil {
		return err
	}
	for _, tid := range tagIDs {
		if err := r.db.Exec("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", postID, tid).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) GetPostsByArchive(year, month int) ([]model.Post, error) {
	var posts []model.Post
	err := r.db.Where("status = ? AND strftime('%Y', published_at) = ? AND strftime('%m', published_at) = ?",
		"published", fmt.Sprintf("%04d", year), fmt.Sprintf("%02d", month)).
		Preload("Category").Preload("Tags").
		Order("published_at DESC").Find(&posts).Error
	return posts, err
}

func (r *Repository) GetTotalPostsCount() (int64, error) {
	var total int64
	err := r.db.Model(&model.Post{}).Count(&total).Error
	return total, err
}

func (r *Repository) GetTotalCommentsCount() (int64, error) {
	var total int64
	err := r.db.Model(&model.Comment{}).Count(&total).Error
	return total, err
}

// Stats

func (r *Repository) GetTotalViewCount() (int64, error) {
	var total int64
	err := r.db.Model(&model.Post{}).Select("COALESCE(SUM(view_count), 0)").Scan(&total).Error
	return total, err
}

func (r *Repository) GetPostCountByStatus() (map[string]int64, error) {
	var results []struct {
		Status string
		Count  int64
	}
	err := r.db.Model(&model.Post{}).Select("status, count(*) as count").Group("status").Scan(&results).Error
	if err != nil {
		return nil, err
	}
	m := make(map[string]int64)
	for _, r := range results {
		m[r.Status] = r.Count
	}
	return m, nil
}

func (r *Repository) GetCategoryDistribution() ([]struct {
	Name  string
	Count int64
}, error) {
	var results []struct {
		Name  string
		Count int64
	}
	err := r.db.Model(&model.Post{}).
		Select("categories.name as name, count(posts.id) as count").
		Joins("LEFT JOIN categories ON categories.id = posts.category_id").
		Where("posts.status = ?", "published").
		Group("categories.name").
		Scan(&results).Error
	return results, err
}

func (r *Repository) GetTopPosts(limit int) ([]model.Post, error) {
	var posts []model.Post
	err := r.db.Where("status = ?", "published").
		Order("view_count DESC").
		Limit(limit).
		Select("id", "title", "slug", "view_count").
		Find(&posts).Error
	return posts, err
}

func (r *Repository) GetMonthlyViewTrend() ([]struct {
	Month string
	Views int64
}, error) {
	var results []struct {
		Month string
		Views int64
	}
	err := r.db.Model(&model.Post{}).
		Select("strftime('%Y-%m', published_at) as month, COALESCE(SUM(view_count), 0) as views").
		Where("status = ? AND published_at IS NOT NULL", "published").
		Group("month").
		Order("month").
		Scan(&results).Error
	return results, err
}
