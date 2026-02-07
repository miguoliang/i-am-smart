# Code Review: Deploy Workflow (2026-02-07)

## Commits Reviewed
1. `a5371b7` - Add GitHub Actions deploy workflow and env design

## Scope
- `.github/workflows/deploy.yml`
- `docs/deploy.md`
- `.env.supabase.example`
- `.gitignore`

## Findings (ordered by severity)

### High
1. **No SSH host key verification for deploy steps**
   - **Location:** `.github/workflows/deploy.yml` (L60-L74)
   - **Risk:** SCP/SSH connections can be vulnerable to man-in-the-middle attacks
     if the host key is not verified.
   - **Recommendation:** Configure host key verification in the `appleboy/scp-action`
     and `appleboy/ssh-action` steps (e.g., provide a trusted `fingerprint`
     or `known_hosts` value via Secrets).

### Medium
1. **Third-party actions are pinned to mutable tags**
   - **Location:** `.github/workflows/deploy.yml` (L61, L70)
   - **Risk:** Tags can be retargeted; this increases supply-chain risk.
   - **Recommendation:** Pin `appleboy/scp-action` and `appleboy/ssh-action`
     to a specific commit SHA.

2. **Deploy step does not ensure a clean target directory**
   - **Location:** `.github/workflows/deploy.yml` (L77-L81)
   - **Risk:** Files removed from the build can remain on the server, causing
     stale assets or unexpected behavior.
   - **Recommendation:** Clean the deployment directory before extract
     (e.g., remove contents or use `rsync --delete`) while preserving any
     required persistent data.

3. **Required environment variables are not validated before build**
   - **Location:** `.github/workflows/deploy.yml` (L27-L47)
   - **Risk:** Empty secrets produce a `.env.supabase` with missing values,
     allowing the build/deploy to succeed but the app to fail at runtime.
   - **Recommendation:** Add explicit checks for required variables and fail
     the workflow with a clear message when any are missing.

### Low
1. **Secrets file permissions are not hardened on the server**
   - **Location:** `.github/workflows/deploy.yml` (L77-L81)
   - **Risk:** `.env.supabase` may be created with default permissions
     (often world-readable) after extraction.
   - **Recommendation:** Set restrictive permissions (e.g., `chmod 600 .env.supabase`)
     after extraction.

2. **Fixed tarball step lacks an explicit failure when missing**
   - **Location:** `.github/workflows/deploy.yml` (L55-L58)
   - **Risk:** If no archive is produced, the SCP step fails later with a
     less specific error.
   - **Recommendation:** Add a check to exit with a clear error if the tarball
     is not found.

## Tests
- Not run (documentation and workflow-only changes).

## Summary
The deployment workflow and documentation are clear and well organized, but a
few security and reliability gaps remain. Addressing host key verification,
pinning third-party actions, and tightening pre-deploy validation would
significantly improve the safety and predictability of production deployments.
