# realtime

Server-pushed event stream layered on `@toa.io/origin` multipart. `connect(id)` opens a long-running multipart POST to `/presence/{id}/`, parses each chunk into a typed event, and re-emits it on a `mitt` bus. `rc()` ties the connection lifecycle to `@/iam`'s `authenticated` derived: connects with the current account id on sign-in, disconnects on sign-out, reconnects automatically on errors. Exposes a `dashboard` store (`status` + last 128 events), a `time` store (server clock — updated from `origin` response `Date` headers), and the `events` emitter for domain modules to subscribe to.

## Wiring

Both `@/iam` and `@/realtime` install `rc()` bootstraps that must run once in the browser. Call them from the root `+layout.ts`:

```ts
import { rc as iam } from '@/iam/rc'
import { rc as realtime } from '@/realtime/rc'
import { browser } from '$app/environment'

if (browser) {
  iam()
  realtime()
}
```

## Domain events

`svc/events.ts` declares `Events = Record<string, unknown> // add domain events here`. Extend it per domain so the emitter is typed end-to-end. Convention: every domain that publishes server events exposes an `Events` type from `@/<domain>/svc/net` and the host intersects them:

```ts
// src/@/realtime/svc/events.ts (edit after install)
import type { Events as Contacts } from '@/contacts/svc/net'
import type { Events as Notifications } from '@/notifications/svc/net'

export type Events = Contacts & Notifications
```

Subscribe in any domain's store:

```ts
import { events } from '@/realtime'

events.on('contact.added', (data) => { /* … */ })
```

## Notes

- **Backend contract.** `/presence/{id}/` must return `multipart/mixed` per `@toa.io/origin` multipart: first part `"ACK"`, then JSON parts of shape `{ event, data }` or the literal string `"heartbeat"`, terminated by `"FIN"`. The Solution forces `credentials: 'include'` and sends `{ timezone }` in the body.
- **Auto-reconnect.** Errors other than `AbortError` retry after 3 s. `disconnect()` (or sign-out via `rc()`) aborts the in-flight request.
- **`time` store.** Seeded with `Date.now()` and updated on every `origin` response — handy for clock skew correction in UI relative timestamps.

## Usage

Read connection status and the last events for a debug panel:

```svelte
<script lang="ts">
  import { dashboard } from '@/realtime'
</script>

<p>Status: {$dashboard.status}</p>
<ul>
  {#each $dashboard.events as e (e)}
    <li>{e.label}: {JSON.stringify(e.payload)}</li>
  {/each}
</ul>
```

Subscribe to a typed event:

```ts
import { events } from '@/realtime'

events.on('heartbeat', () => console.debug('alive'))
```
