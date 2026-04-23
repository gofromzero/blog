# Blog Backend API Contracts

This document reserves the first backend API surface for the blog rebuild. The
current frontend and admin demos can continue to use mock data, but their data
shape should stay compatible with these contracts.

## Data Models

### Post

```ts
type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover?: string;
  categoryId: string;
  tagIds: string[];
  status: "draft" | "published" | "archived";
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

### Category

```ts
type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  visible: boolean;
  postCount: number;
};
```

### Tag

```ts
type Tag = {
  id: string;
  slug: string;
  name: string;
  color?: string;
  postCount: number;
};
```

### SiteSettings

```ts
type SiteSettings = {
  title: string;
  subtitle?: string;
  description?: string;
  authorName: string;
  authorBio?: string;
  avatarUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  maintenanceMode: boolean;
};
```

### AdminSession

```ts
type AdminSession = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin";
  };
  expiresAt: string;
};
```

## Public APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/posts` | List published posts with `keyword`, `category`, `tag`, `page`, `pageSize` filters. |
| `GET` | `/api/posts/:slug` | Get one published post by slug. |
| `GET` | `/api/categories` | List visible categories. |
| `GET` | `/api/tags` | List tags. |
| `GET` | `/api/archives` | Return year/month archive groups. |
| `GET` | `/api/site-settings` | Return public site settings and author profile. |

## Admin APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/auth/login` | Login and return `AdminSession`. |
| `GET` | `/api/admin/auth/me` | Return current admin user. |
| `POST` | `/api/admin/auth/logout` | Revoke current session. |
| `GET` | `/api/admin/posts` | List all posts with status/filter support. |
| `POST` | `/api/admin/posts` | Create a post. |
| `GET` | `/api/admin/posts/:id` | Get a post for editing. |
| `PUT` | `/api/admin/posts/:id` | Update a post. |
| `DELETE` | `/api/admin/posts/:id` | Delete or archive a post. |
| `GET` | `/api/admin/categories` | List categories for management. |
| `POST` | `/api/admin/categories` | Create a category. |
| `PUT` | `/api/admin/categories/:id` | Update a category. |
| `GET` | `/api/admin/tags` | List tags for management. |
| `POST` | `/api/admin/tags` | Create a tag. |
| `PUT` | `/api/admin/tags/:id` | Update a tag. |
| `DELETE` | `/api/admin/tags/:id` | Delete a tag. |
| `GET` | `/api/admin/site-settings` | Read editable site settings. |
| `PUT` | `/api/admin/site-settings` | Save editable site settings. |

## Mock To API Boundary

- Keep mock payloads in the same shape as the contracts above.
- Frontend and admin code should read from a small data-access layer, not call
  mock objects directly from page components.
- Reserve an environment switch such as `VITE_API_MODE=mock|http` when a build
  tool is introduced.
- In `mock` mode, use local fixtures or `localStorage`.
- In `http` mode, use the `/api` paths above and include the admin token for
  `/api/admin/*` requests.
