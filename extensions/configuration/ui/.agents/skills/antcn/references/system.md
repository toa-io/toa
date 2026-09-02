# system

The app's browser/OS platform layer — the counterpart to `shell`/`bridge` for system integration (service-worker lifecycle, updates, offline shell, in-app-webview escape). Its first capability is transparent, user-controlled updates: an installed PWA sees the new version download with live progress, gets a one-tap install control when ready, and restarts cleanly into it. The app version is derived from a bundled `changelog` mount — the same source that feeds the in-app release notes — so the version a user sees, the notes they read, and the build they get never drift.

## Version identity & ordering

The version is the build's **commit short-hash** (e.g. `f3a9c21`), used verbatim as the changelog key, the git release tag, and the on-screen version — so a version you see traces straight to its source with `git show <version>`. It is separate from `$service-worker.version` (the per-build hash), which the worker uses only for its cache name.

Chronological order lives in each entry's `timestamp` (Unix milliseconds): the history sort, the pre-apply update delta, and the running-build baseline all compare `timestamp`. The running build exposes both identities:

| Constant | Type | Meaning |
| --- | --- | --- |
| `version` | `string` | the running build's hash — for display / logging / the SW broadcast |
| `timestamp` | `number` | the running build's release time — the ordering signal |

`timestamp` is stored in svintl as a digit string and read back as a `number`. A fresh install with no releases yet shows a friendly empty state — key `0000000`, headline `Hello`, no date — which the first merged release replaces.

## Setup

Solution-level wiring that feeds the update store the UI reads.

### Runtime wiring — `rc()`

Call `rc()` once in the browser from the root `+layout.ts`. It wires reload-on-apply, the broadcast listener that feeds the `update` store, and cold detection of an already-waiting worker. It never reloads on its own — only an explicit `apply()` (the install control) triggers a restart, so an update can never interrupt a form in progress.

```ts
// src/routes/+layout.ts
import { rc } from '@/system/rc'
import { browser } from '$app/environment'

if (browser) void rc()
```

### Service worker & caches

- **The worker is self-contained.** It carries its own inlined push-payload `Notification` type and keeps the push / notification-click / offline-shell behaviour of a typical app worker, with no `@/transmission` dependency. If you already run `@/transmission`, reconcile the two workers yourself.
- **Two caches.** The versioned app shell + build assets live in `cache-${hash}` (evicted on every update, so the app never serves stale code); runtime images from the API — requests under `/pictures/` — live in a separate `storage` cache, cache-first. Nothing evicts `storage` automatically: it survives updates, so only an explicit `clear()` empties it.

### Localization

This Solution ships **two** svintl mounts — the UI strings (`ui/intl`) and the machine-owned release notes (`svc/changelog/intl`) — each carrying only the locales this repo builds. Reconcile **both** to your own locale set once after install:

```sh
npx intl import system src/@/system/ui/intl
npx intl import changelog src/@/system/svc/changelog/intl
```

Until both are imported, each `built.js` is typed against your `Locale` union and `check` fails on the locales it lacks. Never hand-edit the generated `*.yaml`/`built.js`/`types.ts`.

## In-app-webview escape — `InApp`

An in-app webview (Telegram, Instagram, Facebook, generic embedded browsers) is an insecure, degraded context where passkeys and OIDC popups misbehave. `InApp` guards the whole app against it: on mount it tries to bounce the user out into the real system browser, and if the OS swallows that redirect it overlays a full-screen "Insecure Context" card with a manual Continue control. In a normal browser it renders nothing.

Because the protection must fire on **every** route — not just an auth screen — mount it once, high in the tree, in the root `+layout.svelte`:

```svelte
<script lang="ts">
  import { InApp } from '@/system/ui'
  const { children } = $props()
</script>

<InApp />
{@render children()}
```

The webview detection and the pop-out side-effect are internal — no conditional wiring or environment checks are needed in your layout.

## `VersionControl`

The update status card: a single row that reads the `update` state and renders the running build with an up-to-date check, download progress while caching, or a one-tap install control once an update is waiting. Pass the `update` store value; drop it into a settings/about screen.

### Usage

```svelte
<script lang="ts">
  import { VersionControl } from '@/system/ui'
  import { update } from '@/system'
</script>

<VersionControl update={$update} href="/changelog" />
```

### Props

| Prop | Type | Notes |
| --- | --- | --- |
| `update` | `Update` | The update store value (`$update`). |
| `href` | `string` | Optional. When set, renders a release-notes / what's-new link. |

## `Changelog`

The full release-notes list for a settings/about or dedicated notes screen. Renders the running build's bundled history and, when an update is waiting, the incoming entries above it — the waiting version carries an inline install control, and the running version is tagged as installed. Both come in as props, so you choose the source (the bundled `changelog` mount for history, the `update` store for the incoming delta).

### Usage

```svelte
<script lang="ts">
  import { Changelog } from '@/system/ui'
  import { update, changelog } from '@/system'
</script>

<Changelog update={$update} {changelog} />
```

### Props

| Prop | Type | Notes |
| --- | --- | --- |
| `update` | `Update` | The update store value; a `ready` state contributes the incoming delta and its install control. |
| `changelog` | `Log` | An all-locales changelog — typically the bundled `changelog` mount. |
| `class` | `ClassValue` | Applied to the list. |

## On-demand check — `check()`

Force a fresh update check wherever it makes sense (settings/about screen, pull-to-refresh). `version` is the running app's commit short-hash — the same string shown, tagged, and keyed in the changelog.

```ts
import { check, version } from '@/system'

await check()
```

## Authoring notes

The `changelog` mount is maintained through the `npx intl` CLI — by hand, or automatically by the CI workflows below. Each entry is keyed by commit short-hash and holds translatable `headline`/`description` (Markdown) and non-translatable `timestamp` (Unix milliseconds) / `picture`. `description` renders through `marked` (trusted-content — the notes are authored in-repo, so there is no sanitizer). Never hand-edit the generated `*.yaml`/`built.js`/`types.ts`.

## Automated versioning & changelog (CI)

Two GitHub Actions workflows install to your repo (`.github/workflows/changelog.yml`, `.github/workflows/release.yml`) alongside a static agent prompt (`.github/changelog-prompt.md`). They keep the changelog, the version, and the git tag in sync with zero manual bumping — the responsibility split is deterministic-by-default: an AI agent only edits the intl mount, while committing, pushing, tagging, and releasing are done by fixed steps. **The version is never LLM-generated.**

### `changelog.yml` — on merge to `dev`

Each PR merged into `dev` folds its user-visible changes into the single unreleased "next release" entry:

1. A deterministic Node step computes three things — the version (`git rev-parse --short=7 HEAD`, the commit short-hash), the release timestamp (`Date.now()`, Unix ms), and **which entry is unreleased**: the changelog key present on `dev` but not on `production` (a pure set difference over the built dictionaries, so it needs no ordering and survives a deleted tag). It fails loudly if it ever finds more than one unreleased entry. The agent never picks a version, a time, or an entry.
2. The Cursor CLI is installed from the **official** `curl https://cursor.com/install` (no first-party Action exists; the third-party marketplace one is deliberately avoided — it would receive your `CURSOR_API_KEY` plus write access).
3. `cursor-agent` runs `.github/changelog-prompt.md` and **edits the changelog intl mount only** (it is instructed never to commit, branch, push, or reason about git/ordering): it keys the unreleased entry to the computed hash, writes the timestamp verbatim, integrates the PR diff into its Markdown description, and rebuilds the mount via `npx intl`.
4. `stefanzweifel/git-auto-commit-action` commits the result back to `dev` (`chore(changelog): <hash>`). A `pull_request` trigger does not re-run on this push, so there is no loop.

### `release.yml` — on merge to `production`

Fully deterministic, no AI: reads the newest changelog key (by `timestamp`), tags the released `production` commit with that key verbatim (the commit short-hash), and publishes a GitHub Release whose body is the entry's en-US `description`. The tag is a release label matching the changelog key; it points at the `production` commit, whose own hash differs from the tag name.

### Setup

- **`CURSOR_API_KEY` secret** — required by `changelog.yml`. Add it under repo → Settings → Secrets and variables → Actions.
- **Let the Actions bot push to `dev`.** `changelog.yml` commits back to `dev` with the default `GITHUB_TOKEN`. If `dev` is a protected branch, either add the Actions bot to the bypass list or swap in a PAT / GitHub App token with push rights; on an unprotected `dev` it works as-is.
- **svintl Cursor skill.** The agent drives `npx intl` through the svintl Cursor skill — install it in the repo if absent (e.g. `npx skills add temich/svintl -a --all`).
- **Branches.** The workflows assume a `dev` → `production` flow; rename the trigger branches if yours differ.
