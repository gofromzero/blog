package model

import (
	"time"
)

type Post struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Slug        string    `json:"slug" gorm:"uniqueIndex"`
	Title       string    `json:"title"`
	Excerpt     string    `json:"excerpt"`
	Content     string    `json:"content"`
	Cover       *string   `json:"cover,omitempty"`
	CategoryID  string    `json:"categoryId"`
	Category    Category  `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Tags        []Tag     `json:"tags,omitempty" gorm:"many2many:post_tags;"`
	Status      string    `json:"status" gorm:"default:draft"` // draft | published | archived
	Featured    bool      `json:"featured" gorm:"default:false"`
	ViewCount   int64     `json:"viewCount" gorm:"default:0"`
	PublishedAt *time.Time `json:"publishedAt,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Category struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Slug        string    `json:"slug" gorm:"uniqueIndex"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	Visible     bool      `json:"visible" gorm:"default:true"`
	PostCount   int64     `json:"postCount" gorm:"-"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Tag struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Slug      string    `json:"slug" gorm:"uniqueIndex"`
	Name      string    `json:"name"`
	Color     *string   `json:"color,omitempty"`
	PostCount int64     `json:"postCount" gorm:"-"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type SiteSettings struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	Title           string    `json:"title"`
	Subtitle        *string   `json:"subtitle,omitempty"`
	Description     *string   `json:"description,omitempty"`
	AuthorName      string    `json:"authorName"`
	AuthorBio       *string   `json:"authorBio,omitempty"`
	AvatarUrl       *string   `json:"avatarUrl,omitempty"`
	SeoTitle        *string   `json:"seoTitle,omitempty"`
	SeoDescription  *string   `json:"seoDescription,omitempty"`
	MaintenanceMode bool      `json:"maintenanceMode" gorm:"default:false"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type User struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name"`
	Email     string    `json:"email" gorm:"uniqueIndex"`
	Password  string    `json:"-"`
	Role      string    `json:"role" gorm:"default:admin"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Comment struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	PostID    string    `json:"postId"`
	Post      Post      `json:"post,omitempty" gorm:"foreignKey:PostID"`
	Author    string    `json:"author"`
	Email     string    `json:"email"`
	Content   string    `json:"content"`
	Status    string    `json:"status" gorm:"default:pending"` // pending | approved | spam
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type AdminSession struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	ExpiresAt string `json:"expiresAt"`
}
