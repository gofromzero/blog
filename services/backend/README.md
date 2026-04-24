# services/backend

Blog backend service built with Go, Gin, GORM, and SQLite.

## Features

- RESTful API for posts, categories, tags, comments, archives, and site settings
- JWT-based admin authentication
- Markdown content support
- RSS feed generation
- SQLite database with auto-migration
- CORS enabled for frontend integration
- Seed data for quick start

## Tech Stack

- Go 1.22+
- Gin (HTTP framework)
- GORM (ORM)
- SQLite (embedded database)
- golang-jwt/jwt (authentication)
- bcrypt (password hashing)

## Run

```bash
cd services/backend
go run ./cmd/server
```

Or build and run:

```bash
go build -o server.exe ./cmd/server
./server.exe
```

Server runs on `:8080` by default. Configure via `configs/.env`.

## Default Admin

- Email: `admin@blog.local`
- Password: `admin123`

## API Overview

### Public
- `GET /api/posts` - List published posts
- `GET /api/posts/:slug` - Get post detail
- `GET /api/categories` - List categories
- `GET /api/tags` - List tags
- `GET /api/archives` - Archive groups
- `GET /api/site-settings` - Site info
- `GET /api/rss` - RSS feed
- `GET /api/search?q=` - Search posts
- `GET /api/posts/:slug/comments` - List comments
- `POST /api/posts/:slug/comments` - Submit comment

### Admin (requires Bearer token)
- `POST /api/admin/auth/login`
- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `DELETE /api/admin/posts/:id`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/tags`
- `POST /api/admin/tags`
- `GET /api/admin/comments`
- `PUT /api/admin/comments/:id/approve`
- `GET /api/admin/site-settings`
- `PUT /api/admin/site-settings`
