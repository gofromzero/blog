# services/backend

Reserved for the blog backend service.

Current status: architecture placeholder only. No business API or runtime server
has been implemented yet.

## Planned Structure

```text
api/                 API contracts and route documentation.
cmd/server/          Future service entrypoint.
configs/             Config examples and templates.
internal/config/     Config loading and validation.
internal/handler/    HTTP transport layer.
internal/model/      Data models and DTOs.
internal/repository/ Persistence layer.
internal/service/    Domain services and use cases.
migrations/          Database migrations.
scripts/             Backend utility scripts.
```

## Future Run Commands

Add concrete commands when a backend module is introduced:

```bash
go run ./cmd/server
go test ./...
```

Until then, use `git status --short` to verify repository hygiene.
