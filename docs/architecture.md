# Architecture

This repository uses a lightweight monorepo layout so frontend, admin, and
backend work can progress independently while sharing one Git history.

## Directory Responsibilities

```text
apps/frontend
```

Public blog frontend. This is where the reader-facing demo and application
should live. It should not contain backend business logic or persistence code.

```text
apps/admin
```

Admin console. This is where content management and operational UI should live.
It should call backend APIs instead of directly accessing storage.

```text
services/backend
```

Backend service. This is where HTTP APIs, domain services, persistence adapters,
configuration, migrations, and background jobs should live.

```text
docs
```

Project-wide architecture, workflow, and operation notes.

## Backend Reserved Structure

The backend structure is intentionally present before business implementation so
future backend work has stable extension points:

```text
services/backend/
  api/                 API contract files, OpenAPI specs, or route docs.
  cmd/server/          Future service entrypoint.
  configs/             Example and environment-specific config templates.
  internal/config/     Config loading and validation.
  internal/handler/    HTTP handlers or transport adapters.
  internal/model/      Data models and DTOs.
  internal/repository/ Persistence interfaces and implementations.
  internal/service/    Domain services and use cases.
  migrations/          Database migrations.
  scripts/             Backend-specific operational scripts.
```

## Integration Rules

- Frontend and admin apps should depend on backend API contracts, not backend
  internals.
- Backend packages under `internal` are not shared with apps.
- Shared conventions should be documented in `docs` first, then extracted into
  tooling only when real duplication appears.
- Environment-specific values must stay out of Git; commit only examples such
  as `.env.example`.
