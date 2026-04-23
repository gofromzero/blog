# Git Workflow

## Branches

Do not commit directly to `main`. Create a short-lived branch for each task.

Recommended formats:

```text
agent/<agent-name>/<workspace-or-task-id>
feature/<scope>/<short-description>
fix/<scope>/<short-description>
chore/<scope>/<short-description>
```

Examples:

```text
agent/dev-agent-work/abca6531
feature/frontend/public-blog-demo
chore/repo/bootstrap-skeleton
```

## Commits

Use concise commit messages with an explicit type and owner marker.

```text
[type][agent] subject
```

Types:

- `feat`: user-visible feature
- `fix`: bug fix
- `chore`: repository, tooling, or configuration work
- `docs`: documentation-only change
- `refactor`: behavior-preserving code change
- `test`: test-only change

Examples:

```text
[chore][dev] initialize repository skeleton
[docs][dev] document backend reserved structure
```

## Reviews

Each pull request or handoff should include:

- Branch name.
- Summary of changed directories.
- Run or verification commands.
- Known risks and follow-up tasks.

## Protected Boundaries

- Frontend demo changes belong under `apps/frontend`.
- Admin demo changes belong under `apps/admin`.
- Backend implementation belongs under `services/backend`.
- Repository governance belongs in root config files and `docs`.
