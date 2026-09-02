#!/usr/bin/env sh
# Block direct edits to svintl-generated intl files, for every AI agent.
# Wired from Claude Code (.claude/settings.json), Cursor (.cursor/hooks.json)
# and Codex (.codex/hooks.json) as a pre-edit hook.
#
# Why: everything under */intl/ except index.ts is generated/owned by svintl.
# Hand-editing *.yaml / built.js / types.ts desyncs the built dictionaries.
# Change them via `npx intl` or the /svintl skill instead.
#
# Universal deny = exit 2 + reason on stderr (honored by all three agents).
# Only pre-*edit* tools invoke this hook, so scanning the payload for a
# protected path can't block reads.

set -eu

payload="$(cat)"

# Generated/managed files living directly inside any `*/intl/` directory:
#   *.yaml (locales + context.yaml), built.js, types.ts.
# index.ts is hand-written boilerplate -> intentionally not matched.
protected='/intl/([A-Za-z0-9._-]+\.ya?ml|built\.js|types\.ts)'

hit="$(printf '%s' "$payload" | grep -oE "$protected" | head -n1 || true)"

[ -z "$hit" ] && exit 0

cat >&2 <<EOF
Blocked: edit to a generated intl file (matched "$hit").

svintl owns every *.yaml, built.js and types.ts under */intl/ — editing them by
hand desyncs the generated dictionaries. Use the tool, not the editor:

  npx intl add <key> <value> [comment]   # new phrase (auto-translates)
  npx intl set <key> <value> [comment]   # update existing
  npx intl del|move|create|build …       # other ops (npx intl --help)
  /svintl                                # skill wrapping the above

Only intl/index.ts is hand-written.
EOF
exit 2
