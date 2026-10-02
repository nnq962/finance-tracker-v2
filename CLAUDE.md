# Project layout

- `web/` — Next.js app (run npm commands here). Its rules are below.
- `db/` — PostgreSQL schema and dbmate migrations, shared by web and backend.
- `backend/` — Python services (reminder worker; LLM later).
- `deploy/` — Docker Compose and deploy/backup/dev-database scripts.
- `docs/design/` — UI design mockups.

See README.md for how the parts fit together.

@web/AGENTS.md
