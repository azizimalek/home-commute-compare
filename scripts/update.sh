#!/usr/bin/env bash
# Pull latest code and reinstall dependencies.
# Usage: ./scripts/update.sh
# Run from the repo root (commute-compare/).

set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Pulling latest changes..."
git pull --ff-only origin main

echo "→ Installing dependencies..."
npm ci

echo "✓ Repo is up to date."
echo "  Run locally:  npm run dev"
echo "  Build:        npm run build"
