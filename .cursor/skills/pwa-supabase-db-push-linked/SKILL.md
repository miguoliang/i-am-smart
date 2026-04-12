---
name: pwa-supabase-db-push-linked
description: >-
  Pushes local Supabase migrations to the linked remote database using the Supabase CLI from the PWA app directory. Use when applying schema/migration changes to the linked Supabase project, when the user mentions db push, supabase push, deploying migrations, or syncing migrations to production/staging.
---

# PWA Supabase `db push --linked`

## Scope

- **Repository path**: Supabase config and migrations live under [`apps/pwa/supabase/`](apps/pwa/supabase/) (e.g. [`apps/pwa/supabase/migrations/`](apps/pwa/supabase/migrations/)).
- **Command**: From the **`apps/pwa`** directory (parent of `supabase/`), run:

```bash
cd apps/pwa && supabase db push --linked
```

Or with absolute path:

```bash
cd /path/to/be-it-forever/apps/pwa && supabase db push --linked
```

## What `--linked` does

- Applies pending migration files to the **remote** database associated with the CLI-linked Supabase project (not only local Docker).
- Requires the project to be **linked** (`supabase link --project-ref <ref>`) and appropriate credentials/session for the Supabase CLI.

## When to use

- After adding or editing SQL files under `apps/pwa/supabase/migrations/`.
- When the user asks to deploy migrations, push DB changes, or run `supabase db push` against the linked project.

## Agent workflow

1. Ensure working directory is **`apps/pwa`** (where `supabase/config.toml` exists).
2. Run: `supabase db push --linked`.
3. If the CLI reports not linked, tell the user they need `supabase link` (or login) first; do not invent project refs.

## Notes

- Do **not** run `db push` from the monorepo root unless `supabase/` is there; for this project, always **`apps/pwa`**.
- For local-only testing, developers may use `supabase start` / local DB; `db push --linked` is for **remote** sync as specified here.
