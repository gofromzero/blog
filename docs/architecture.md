# Architecture

This repository uses a lightweight monorepo layout so frontend and backend work
can progress independently while sharing one Git history.

## Directory Responsibilities

```text
apps/frontend
```

Public blog frontend. A vanilla JS SPA with dark-mode UI, API-driven pages,
embedded admin console (`/admin`), and a static file server.

```text
services/backend
```

Backend service. HTTP APIs, domain services, persistence adapters,
configuration, migrations, and seed data.

```text
docs
```

Project-wide architecture, workflow, and operation notes.

## Backend Structure

```text
services/backend/
  api/                 API contract files and route docs.
  cmd/server/          Service entrypoint.
  configs/             Config examples and templates.
  internal/config/     Config loading and validation.
  internal/handler/    HTTP transport layer.
  internal/middleware/ Authentication middleware.
  internal/model/      Data models and DTOs.
  internal/repository/ Persistence layer.
  internal/service/    Domain services and use cases.
  migrations/          Database migrations.
  scripts/             Operational scripts.
```

## Frontend Structure

```text
apps/frontend/
  index.html           SPA shell.
  server.js            Static file server (Node built-ins only).
  src/
    app.js             Router, API client, page renders, admin dashboard.
    styles.css         Dark/light theme variables, animations, layout.
```

## Integration Rules

- Frontend depends on backend API contracts, not backend internals.
- Backend packages under `internal` are not shared with apps.
- Environment-specific values must stay out of Git; commit only examples such
  as `.env.example`.
