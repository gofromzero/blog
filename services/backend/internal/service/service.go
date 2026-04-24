package service

import (
	"errors"
	"time"

	"blog-backend/internal/model"
	"blog-backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *repository.Repository
	jwtSecret string
}

func New(repo *repository.Repository, jwtSecret string) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

// Auth

func (s *Service) Login(email, password string) (*model.AdminSession, error) {
	user, err := s.repo.GetUserByEmail(email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	return &model.AdminSession{
		Token:     tokenString,
		User:      *user,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
	}, nil
}

func (s *Service) ValidateToken(tokenString string) (*model.User, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userID, _ := claims["user_id"].(string)
	user, err := s.repo.GetUserByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return user, nil
}

// Posts

func (s *Service) ListPosts(keyword, category, tag string, page, pageSize int) ([]model.Post, int64, error) {
	return s.repo.ListPosts(keyword, category, tag, page, pageSize)
}

func (s *Service) GetPostBySlug(slug string) (*model.Post, error) {
	post, err := s.repo.GetPostBySlug(slug)
	if err != nil {
		return nil, err
	}
	_ = s.repo.IncrementViewCount(post.ID)
	post.ViewCount++
	return post, nil
}

func (s *Service) CreatePost(post *model.Post, tagIDs []string) error {
	post.ID = generateID()
	post.Slug = slugify(post.Title) + "-" + post.ID[:8]
	post.CreatedAt = time.Now()
	post.UpdatedAt = time.Now()
	if post.Status == "published" && post.PublishedAt == nil {
		now := time.Now()
		post.PublishedAt = &now
	}
	if err := s.repo.CreatePost(post); err != nil {
		return err
	}
	if len(tagIDs) > 0 {
		return s.repo.SetPostTags(post.ID, tagIDs)
	}
	return nil
}

func (s *Service) UpdatePost(id string, post *model.Post, tagIDs []string) error {
	existing, err := s.repo.GetPostByID(id)
	if err != nil {
		return err
	}
	existing.Title = post.Title
	existing.Excerpt = post.Excerpt
	existing.Content = post.Content
	existing.Cover = post.Cover
	existing.CategoryID = post.CategoryID
	existing.Status = post.Status
	existing.Featured = post.Featured
	existing.UpdatedAt = time.Now()
	if post.Status == "published" && existing.PublishedAt == nil {
		now := time.Now()
		existing.PublishedAt = &now
	}
	if err := s.repo.UpdatePost(existing); err != nil {
		return err
	}
	if len(tagIDs) > 0 {
		return s.repo.SetPostTags(id, tagIDs)
	}
	return nil
}

func (s *Service) DeletePost(id string) error {
	return s.repo.DeletePost(id)
}

func (s *Service) ListAllPosts(keyword, status string, page, pageSize int) ([]model.Post, int64, error) {
	return s.repo.ListAllPosts(keyword, status, page, pageSize)
}

func (s *Service) GetPostByID(id string) (*model.Post, error) {
	return s.repo.GetPostByID(id)
}

// Categories

func (s *Service) ListCategories() ([]model.Category, error) {
	return s.repo.ListCategories()
}

func (s *Service) ListAllCategories() ([]model.Category, error) {
	return s.repo.ListAllCategories()
}

func (s *Service) CreateCategory(cat *model.Category) error {
	cat.ID = generateID()
	cat.CreatedAt = time.Now()
	cat.UpdatedAt = time.Now()
	return s.repo.CreateCategory(cat)
}

func (s *Service) UpdateCategory(cat *model.Category) error {
	cat.UpdatedAt = time.Now()
	return s.repo.UpdateCategory(cat)
}

func (s *Service) DeleteCategory(id string) error {
	return s.repo.DeleteCategory(id)
}

// Tags

func (s *Service) ListTags() ([]model.Tag, error) {
	return s.repo.ListTags()
}

func (s *Service) CreateTag(tag *model.Tag) error {
	tag.ID = generateID()
	tag.CreatedAt = time.Now()
	tag.UpdatedAt = time.Now()
	return s.repo.CreateTag(tag)
}

func (s *Service) UpdateTag(tag *model.Tag) error {
	tag.UpdatedAt = time.Now()
	return s.repo.UpdateTag(tag)
}

func (s *Service) DeleteTag(id string) error {
	return s.repo.DeleteTag(id)
}

// SiteSettings

func (s *Service) GetSiteSettings() (*model.SiteSettings, error) {
	return s.repo.GetSiteSettings()
}

func (s *Service) SaveSiteSettings(settings *model.SiteSettings) error {
	return s.repo.SaveSiteSettings(settings)
}

// Comments

func (s *Service) ListCommentsByPost(postID string) ([]model.Comment, error) {
	return s.repo.ListCommentsByPost(postID)
}

func (s *Service) CreateComment(comment *model.Comment) error {
	comment.ID = generateID()
	comment.Status = "pending"
	comment.CreatedAt = time.Now()
	comment.UpdatedAt = time.Now()
	return s.repo.CreateComment(comment)
}

func (s *Service) ListAllComments(page, pageSize int) ([]model.Comment, int64, error) {
	return s.repo.ListAllComments(page, pageSize)
}

func (s *Service) ApproveComment(id string) error {
	return s.repo.UpdateCommentStatus(id, "approved")
}

func (s *Service) DeleteComment(id string) error {
	return s.repo.DeleteComment(id)
}

// Archives

func (s *Service) GetArchives() ([]map[string]interface{}, error) {
	return s.repo.GetArchives()
}

func (s *Service) GetPostsByArchive(year, month int) ([]model.Post, error) {
	return s.repo.GetPostsByArchive(year, month)
}

// Search

func (s *Service) SearchPosts(keyword string) ([]model.Post, error) {
	return s.repo.SearchPosts(keyword)
}

type CategoryDistItem struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

type MonthlyTrendItem struct {
	Month string `json:"month"`
	Views int64  `json:"views"`
}

// Stats

type Stats struct {
	TotalPosts    int64              `json:"totalPosts"`
	TotalViews    int64              `json:"totalViews"`
	TotalComments int64              `json:"totalComments"`
	StatusCounts  map[string]int64   `json:"statusCounts"`
	CategoryDist  []CategoryDistItem `json:"categoryDist"`
	TopPosts      []model.Post       `json:"topPosts"`
	MonthlyTrend  []MonthlyTrendItem `json:"monthlyTrend"`
}

func (s *Service) GetStats() (*Stats, error) {
	totalPosts, err := s.repo.GetTotalPostsCount()
	if err != nil {
		return nil, err
	}

	totalViews, err := s.repo.GetTotalViewCount()
	if err != nil {
		return nil, err
	}

	totalComments, err := s.repo.GetTotalCommentsCount()
	if err != nil {
		return nil, err
	}

	statusCounts, err := s.repo.GetPostCountByStatus()
	if err != nil {
		return nil, err
	}

	rawCatDist, err := s.repo.GetCategoryDistribution()
	if err != nil {
		return nil, err
	}
	catDist := make([]CategoryDistItem, len(rawCatDist))
	for i, c := range rawCatDist {
		catDist[i] = CategoryDistItem{Name: c.Name, Count: c.Count}
	}

	topPosts, err := s.repo.GetTopPosts(5)
	if err != nil {
		return nil, err
	}

	rawMonthly, err := s.repo.GetMonthlyViewTrend()
	if err != nil {
		return nil, err
	}
	monthlyTrend := make([]MonthlyTrendItem, len(rawMonthly))
	for i, m := range rawMonthly {
		monthlyTrend[i] = MonthlyTrendItem{Month: m.Month, Views: m.Views}
	}

	return &Stats{
		TotalPosts:    totalPosts,
		TotalViews:    totalViews,
		TotalComments: totalComments,
		StatusCounts:  statusCounts,
		CategoryDist:  catDist,
		TopPosts:      topPosts,
		MonthlyTrend:  monthlyTrend,
	}, nil
}
