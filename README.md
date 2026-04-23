# Blog

Blog is being rebuilt as a separated frontend/backend workspace. This
repository currently contains the engineering skeleton only: repository
governance, directory ownership, and backend extension points. Page demos are
owned by a separate frontend task.

## Repository Layout

```text
apps/
  frontend/        Public blog frontend application placeholder.
  admin/           Admin console application placeholder.
services/
  backend/         Backend service placeholder and future API structure.
docs/
  architecture.md  Repository architecture and ownership boundaries.
  git-workflow.md  Branch, commit, and review conventions.
```

## Development Boundaries

- `apps/frontend` is reserved for the public blog demo and future frontend app.
- `apps/admin` is reserved for the admin demo and future management console.
- `services/backend` is reserved for API, persistence, and backend jobs.
- Cross-cutting conventions live in `docs`.

The current branch does not implement UI pages or business APIs. It only
prepares the structure needed by later frontend and backend work.

## Getting Started

There is no runnable application yet. Use these checks while the repository is
still in skeleton state:

```bash
git status --short
git branch --show-current
```

When applications are added, each app/service should provide its own local
README with install, run, test, and build commands.

## Branch And Commit Conventions

Use feature branches instead of committing directly to `main`.

Recommended branch format:

```text
agent/<role-or-owner>/<short-task-id>
feature/<scope>/<short-description>
fix/<scope>/<short-description>
```

Recommended commit format:

```text
[type][agent] subject
```

Examples:

```text
[chore][dev] initialize blog repository skeleton
[fix][dev] resolve backend config loading
```

See [docs/git-workflow.md](docs/git-workflow.md) for details.

## Ownership Notes

This repository intentionally keeps frontend demo work separate from backend
and repository governance work. Future contributors should avoid placing shared
configuration inside a single app unless it is app-specific.
