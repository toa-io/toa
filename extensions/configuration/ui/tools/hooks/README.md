# Agent hooks

`guard-intl.sh` — pre-edit hook blocking direct edits to svintl-generated intl
files (`*.yaml`, `built.js`, `types.ts` under any `*/intl/`; `index.ts` allowed).
Denies via exit 2 + stderr, pointing at `npx intl` / `/svintl`.

Wired per agent (project-scoped, committed):

| Agent       | Config              | Activation note                                     |
| ----------- | ------------------- | --------------------------------------------------- |
| Claude Code | `.claude/settings.json` | Run `/hooks` to review+approve on first load        |
| Cursor      | `.cursor/hooks.json`    | Hooks GA (≥1.7); reloads on save, restart if not    |
| Codex       | `.codex/hooks.json`     | Run `/hooks` to trust the hook before it runs       |
