#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" =~ ^(-h|--help)$ ]] || [[ -z "${1:-}" ]]; then
  echo "Usage: ./release.sh <version>"
  echo "  version: X.Y.Z (e.g., 0.1.0)"
  exit 0
fi

VERSION="$1"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format X.Y.Z (e.g., 0.1.0)"
  exit 1
fi

echo "Releasing v$VERSION"

npm version "$VERSION" --no-git-tag-version
npm install

npm audit --audit-level=critical
npm run check
npm run test:unit
npm run test:integration

npm run build

git add package.json package-lock.json
git commit -m "v$VERSION"
git tag "v$VERSION"

echo "Done. Push with: git push origin main v$VERSION"
