#!/usr/bin/env bash
# Package Next.js standalone build for production deployment.
#
# Usage: ./scripts/package-standalone.sh [OPTIONS]
#
# Options:
#   --archive        Create a tarball in deploy/ as well as the standalone folder.
#   --env FILE       Env file to load for build and to include in the package.
#                    Can be repeated. Default: .env.local
#
# The script:
#   1. Temporarily replaces .env.local with the chosen env file so "next build" uses it
#      (Next.js always loads .env.local; we don't tell it which file, we just swap content).
#   2. Runs "npm run build" (Next.js standalone output).
#   3. Restores .env.local, then copies public/ and .next/static into the standalone output.
#   4. Copies the env file(s) into the release folder (for runtime on the server).
#   5. Writes the result to deploy/standalone/ (and optionally a .tar.gz).
#
# On the server, run: PORT=3000 node server.js (from inside the standalone folder).

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

STANDALONE_DIR=".next/standalone"
RELEASE_DIR="${RELEASE_DIR:-deploy/standalone}"
ARCHIVE=false
ENV_FILES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --archive) ARCHIVE=true; shift ;;
    --env)     ENV_FILES+=("$2"); shift 2 ;;
    *)         shift ;;
  esac
done

if [[ ${#ENV_FILES[@]} -eq 0 ]]; then
  ENV_FILES=(.env.local)
fi

# Next.js always loads .env.local; we don't tell it which file. We temporarily replace
# .env.local with the chosen env file for the build, then restore it.
BUILD_ENV="${ENV_FILES[0]}"
ENV_LOCAL=".env.local"
BACKUP_ENV=""
if [[ -f "$BUILD_ENV" ]]; then
  if [[ -f "$ENV_LOCAL" ]]; then
    BACKUP_ENV=$(mktemp)
    cp "$ENV_LOCAL" "$BACKUP_ENV"
  fi
  echo "Using $BUILD_ENV for next build (temporarily replacing $ENV_LOCAL)..."
  cp "$BUILD_ENV" "$ENV_LOCAL"
fi

cleanup_build_env() {
  if [[ -n "$BACKUP_ENV" && -f "$BACKUP_ENV" ]]; then
    cp "$BACKUP_ENV" "$ENV_LOCAL"
    rm -f "$BACKUP_ENV"
  elif [[ -f "$BUILD_ENV" ]]; then
    rm -f "$ENV_LOCAL"
  fi
}
trap cleanup_build_env EXIT

echo "Building Next.js (standalone)..."
npm run build

if [[ ! -d "$STANDALONE_DIR" ]]; then
  echo "Error: standalone output not found at $STANDALONE_DIR. Ensure next.config has output: 'standalone'." >&2
  exit 1
fi

echo "Copying public and static into standalone..."
cp -r public "$STANDALONE_DIR/public"
mkdir -p "$STANDALONE_DIR/.next"
cp -r .next/static "$STANDALONE_DIR/.next/static"

echo "Preparing release at $RELEASE_DIR..."
rm -rf "$RELEASE_DIR"
mkdir -p "$(dirname "$RELEASE_DIR")"
cp -r "$STANDALONE_DIR" "$RELEASE_DIR"

for envfile in "${ENV_FILES[@]}"; do
  if [[ -f "$envfile" ]]; then
    echo "Including $envfile in package..."
    cp "$envfile" "$RELEASE_DIR/$(basename "$envfile")"
  else
    echo "Warning: $envfile not found, skipping." >&2
  fi
done

if [[ "$ARCHIVE" == true ]]; then
  STAMP=$(date +%Y%m%d-%H%M)
  TARBALL="deploy/standalone-${STAMP}.tar.gz"
  echo "Creating archive $TARBALL..."
  mkdir -p deploy
  tar -czf "$TARBALL" -C "$(dirname "$RELEASE_DIR")" "$(basename "$RELEASE_DIR")"
  echo "Done. Standalone: $RELEASE_DIR | Archive: $TARBALL"
else
  echo "Done. Standalone: $RELEASE_DIR"
  echo "Run: PORT=3000 node $RELEASE_DIR/server.js"
fi
