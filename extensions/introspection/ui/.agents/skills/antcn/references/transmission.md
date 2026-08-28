# transmission

Web-push / FCM notification permission, subscription, and per-domain preferences for the signed-in account. Boots a single push channel (FCM iOS handler if present, else Web Push), reconciles permission with the backend after sign-in, exposes a `permissions` store keyed by `ScopeKey`, and lets you toggle them via `configure(...)`.

`subscribe`/`unsubscribe` drive the platform channel and the backend record together; `request()` prompts the OS and follows through with a subscribe on grant. `ping()` round-trips a test notification. State lives under `transmission:subscribed` and `transmission:permissions` (bound to `@/iam`'s `account`); the `default.transmission.sync` realtime event refreshes permissions when other devices change them.

Ships two UI pieces (`Permission`, `Scopes`) plus its own `ui/intl/` mount. Run `await rc()` from app bootstrap (after `@/iam` and `@/realtime`) to wire auto-subscribe on sign-in and `@/realtime` sync.

## `$config`

- `VAPID_PUBLIC_KEY: string` — base64url VAPID public key for Web Push subscriptions. Empty disables the Web Push channel (`getVapidKey` returns an `Error` and `subscribe()` short-circuits). Not used by the FCM/TWA channels.

## Notes

- **Intersect `transmission`'s `Events` into your `@/realtime`.** After install, edit your own `src/@/realtime/svc/events.ts` and add `TransmissionEvents` to the `Events` intersection — typed payloads everywhere, no cast in `store.ts`:

  ```ts
  // src/@/realtime/svc/events.ts
  import type { Events as TransmissionEvents } from '@/transmission/svc/net'
  // ...other Solutions' Events imports

  export type Events = TransmissionEvents & /* & OtherEvents */
  ```

  Until you do, `store.ts` keeps a `(data as Transmission)` cast against `@/realtime`'s default `Record<string, unknown>`.

- **`Window.webkit` global.** The FCM channel declares `Window.webkit` and `WebkitMessageHandlers` globally from its `types.d.ts`. If you ship more native bridges (e.g. Apple Pay), extend `WebkitMessageHandlers` the same way — interface merging means you don't need to redeclare `Window.webkit`.

- **TWA channel ships but isn't wired by default.** `svc/channel/active.ts` only boots `web` and `fcm`. Add `twa` to the boot order if you target Android TWAs.

## Usage

Bootstrap once, after `@/iam` and `@/realtime`:

```ts
// src/routes/+layout.svelte (or wherever you boot Solutions)
import { rc } from '@/transmission'

await rc()
```

Programmatic API (no UI):

```ts
import { configure, ping, request, unsubscribe, key, permissions } from '@/transmission'

await request()                                            // OS prompt + subscribe (idempotent)
await configure({ [key({ domain: 'expenses' })]: false })  // mute one domain
await ping()                                               // round-trip a test push (signed-in + subscribed)
await unsubscribe()                                        // drop subscription on this device
$permissions                                               // reactive scope→bool map
```

Send a real push from your backend by `POST`ing to the user's `transmission/<identity>` row — see `svc/net` for the wire shape.

## `Permission`

Onboarding nag card asking the user to enable push. Drop it on a high-traffic surface (dashboard, home, post-sign-in screen). Self-hides via `@/hints` once the user is no longer `unfamiliar('transmission_permission')`: **Enable** calls `request()` (OS prompt + subscribe on grant) and consumes the hint permanently; **Dismiss** marks it `later(KEY, 7d)` so the card disappears for a week. Gate it on `$promptable` yourself — the component does not check whether the browser can still prompt, so the caller decides when there's nothing left to ask for (denied, already subscribed, unsupported).

```svelte
<script lang="ts">
  import { promptable } from '@/transmission'
  import { Permission } from '@/transmission/ui'
</script>

{#if $promptable}
  <Permission class="mb-4" />
{/if}
```

### Props

| Prop    | Type         | Default | Notes                          |
| ------- | ------------ | ------- | ------------------------------ |
| `class` | `ClassValue` | —       | Forwarded to the root `Card`.  |

## `Scopes`

Settings row for managing notifications on the current device. The master switch flips the whole subscription (`unsubscribe()` / `request()` under the hood); when on, per-domain switches expand below and toggle a single channel via `configure({ [key(scope)]: bool })` — muting it without dropping the subscription. Reads `$permissions`, so it reflects remote changes pushed via the `default.transmission.sync` realtime event (other devices, backend writes). The domain set is declared in `ui/Scopes.ts` (`scopes`) — edit it to add/remove rows; each row pulls its label/description from `ui/intl` keyed by `scope.domain`.

```svelte
<script lang="ts">
  import { Scopes } from '@/transmission/ui'
  import * as Item from '$ui/item'
</script>

<Item.Group>
  <Scopes />
</Item.Group>
```

### Props

| Prop    | Type         | Default | Notes                                                |
| ------- | ------------ | ------- | ---------------------------------------------------- |
| `class` | `ClassValue` | —       | Forwarded to the top-level `Item.Root` (master row). |
