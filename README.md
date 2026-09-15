# NATRA

A modern, simple, solid food-ordering marketplace for virtual/home-based
restaurants. Restaurants prepare and hand over/deliver their own orders — no
platform delivery, no payment gateway, no customer accounts.

## Repo structure

```
/frontend   → customer, restaurant owner, and admin web app
/backend    → API, business logic, DB access, Object Storage integration
/docs       → product spec, roadmap, task list, reference UI, project status
```

## Roles
- **Customer** — browses, orders, and tracks orders by phone number (no account)
- **Restaurant Owner** — manages their own restaurant, menu, and orders
- **Admin** — approves restaurants and oversees the platform

## Documentation
See `/docs` for:
- `NATRA_MASTER_PROMPT.md` — full product/UX/technical spec
- `ROADMAP.md` — phased build plan
- `TASKS.md` — granular task checklist
- `PROJECT_STATUS.md` — current progress
- `reference_ui/` — visual source-of-truth screenshots

## Stack
- Frontend: TBD (see roadmap Phase 2)
- Backend: TBD (see roadmap Phase 1)
- Database: Oracle Autonomous AI Database
- Storage: Oracle Object Storage
- Hosting: Oracle Cloud VM (Ubuntu)
- Source control: GitHub

## Status
Phase 0 (Foundation) fully scaffolded — DB schema/migrations, Oracle DB +
Object Storage connections, seed data, a real DB/storage health check, and
CI (lint + build on push, see `.github/workflows/ci.yml`) are all in
place. Phase 1 (reusable backend kit) is underway: `crudFactory`
(generic CRUD + ownership-scoping + Jest tests), `ownershipMiddleware`, and
`uploadToObjectStorage` (`backend/src/services/`) are all done. See
`docs/PROJECT_STATUS.md` for current task progress.
