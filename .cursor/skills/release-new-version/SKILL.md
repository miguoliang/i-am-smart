---
name: release-new-version
description: >-
  Bumps the monorepo and PWA app version, updates CHANGELOG.md, runs checks, commits, and pushes Git tag vX.Y.Z for this repository (i-am-smart / be-it-forever). Use when the user asks to make a release, ship a version, cut a tag, bump version, or publish vX.Y.Z.
---

# Make a new release (this repo)

## Version sources (must stay aligned)

1. **[`package.json`](package.json)** (repo root): `"version"` — monorepo root version.
2. **[`apps/pwa/package.json`](apps/pwa/package.json)** — **same semver**; Next injects it as **`NEXT_PUBLIC_APP_VERSION`** via [`apps/pwa/next.config.ts`](apps/pwa/next.config.ts) (`require("./package.json")`).

Bump **both** to the next logical semver (usually **patch** unless the user asks for minor/major).

## Changelog

- Edit **[`CHANGELOG.md`](CHANGELOG.md)** at the **top** (after the intro block).
- Add a section: `## [X.Y.Z] - YYYY-MM-DD` (use the **current calendar date** for the release entry).
- Summarize **user-visible or deploy-relevant** changes since the previous version (Chinese prose, same style as existing entries).
- Under `### 发布`, note: version **vX.Y.Z**, alignment with `NEXT_PUBLIC_APP_VERSION` / both `package.json` files, and Git tag **`vX.Y.Z`**.
- If the release includes **Supabase migrations**, mention applying them in the target environment (migration filename or `supabase db push` as appropriate).

Do **not** add unrelated markdown files unless the user asks.

## Pre-flight checks

From the repo root:

```bash
pnpm run type-check
pnpm --filter @i-am-smart/pwa test
```

Fix failures before tagging. (Husky may also run lint/tests on `git commit`.)

## Git workflow

1. Stage all changes that belong in the release (including version bumps, `CHANGELOG.md`, and any code already merged for this release).
2. Commit with a clear message, for example:  
   `chore(release): vX.Y.Z`  
   and a short body listing the main theme of the release.
3. Create an **annotated** tag:  
   `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
4. Push branch and tag:  
   `git push origin main`  
   `git push origin vX.Y.Z`  
   (Use the repo’s default branch name if not `main`.)

## Agent behavior

- **Execute** these steps in the environment; do not only instruct the user to run commands.
- If **nothing is staged** and the user only asked for a “release” with no new commits, confirm what should be included or bump version + changelog to match already-merged work.
- If the remote **push fails** (auth/network), report the error; the local tag/commit may still exist.

## Not in scope by default

- Publishing to npm (private app).
- Editing `.cursor/plans` or skill files unless the user explicitly includes them in the release.
