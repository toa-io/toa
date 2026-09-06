#!/usr/bin/env bash
# Create a GitHub Release for the version Lerna already tagged.
# Notes come from conventional-changelog (the same page Lerna used to write
# into each package). Nothing is written into the tree.

set -euo pipefail

VERSION=$(node -p "require('./lerna.json').version")
TAG="v${VERSION}"
LATEST=$(git describe --abbrev=0 --tags)

if [ "$LATEST" != "$TAG" ]; then
  echo "lerna.json is ${VERSION} but the latest tag from HEAD is ${LATEST}" >&2
  exit 1
fi

if [ -z "${DRY_RUN:-}" ] && gh release view "$TAG" >/dev/null 2>&1; then
  echo "$TAG already has a GitHub release"
  exit 0
fi

NOTES_FILE=$(mktemp)
trap 'rm -f "$NOTES_FILE"' EXIT

# -r 2 is unreleased (empty once the tag is on HEAD) plus the tagged release.
# The empty `# [](...)` header is dropped; the versioned section is the body.
npx --yes -p conventional-changelog@8.1.0 -p conventional-changelog-angular@9.4.0 \
  conventional-changelog -p angular -r 2 --stdout \
  | awk 'BEGIN { p = 0 } /^# \[[0-9]/ { p = 1 } p' \
  > "$NOTES_FILE"

if ! grep -q . "$NOTES_FILE"; then
  echo "conventional-changelog wrote nothing for ${TAG}" >&2
  exit 1
fi

if [ -n "${DRY_RUN:-}" ]; then
  echo "would create ${TAG}"
  cat "$NOTES_FILE"
  exit 0
fi

ARGS=(release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE")

if [[ "$VERSION" == *-* ]]; then
  ARGS+=(--prerelease)
fi

gh "${ARGS[@]}"
