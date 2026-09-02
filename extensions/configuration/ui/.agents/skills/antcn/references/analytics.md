# analytics

Consent-first GA4 + Google Tag Manager analytics. A typed `track()` dual-dispatches to a GA4 property (via a `gtag` shim) and/or a GTM container; a Consent Mode v2 cookie banner collects consent before any non-essential storage, shown only to visitors inside a prior-consent jurisdiction (resolved through `geo`) and auto-granting elsewhere. Events are an open interface each domain owns and augments.

## Environment

Configured through `VITE_*` env vars (read at build via `import.meta.env`, so no custom `envPrefix` is needed). Set whichever delivery you use — at least one `id` must be present or the whole stack no-ops:

| Var                | Example        | Notes                                                                 |
| ------------------ | -------------- | --------------------------------------------------------------------- |
| `VITE_GA_ID`       | `G-XXXXXXXXXX` | GA4 Measurement ID. When set, events go to GA4 via `gtag` (takes priority). |
| `VITE_GTM_ID`      | `GTM-XXXXXXX`  | GTM container ID. Used for `track()` only when `VITE_GA_ID` is unset; otherwise the container still sees gtag's push as a Custom Event. |
| `VITE_GTM_AUTH`    | `abc123…`      | Optional — GTM Environment snippet auth param. Empty for the Live environment. |
| `VITE_GTM_PREVIEW` | `env-3`        | Optional — GTM Environment snippet preview param. Empty for Live.     |

## Notes

- **Bootstrap with `rc()`.** Run it once on app start (see Usage). It emits the `consent default` + `platform` user-property commands, resolves the consent zone, then either auto-grants (out of zone), re-applies a stored choice, or opens the banner. It no-ops when neither id is set.
- **Page-view title.** Pass `<Analytics title={…}>` the resolved page title so the `page_view` event isn't subject to the SPA `document.title` race.
- **Re-opening consent.** `<Manage>` is an optional "Cookie settings" button (place it in a footer or settings row); it renders only inside a prior-consent zone once a choice has been made.
- **Banner copy.** Ships its own svintl mount in the registry's four locales with neutral copy. After install, reconcile it to your locale set: `npx intl import analytics src/@/analytics/ui/intl`. The body links to `/privacy/` — point it at your policy via the mount.
- **Native iOS shell.** `settle('ios_shell')` resolves to `denied` (App Store privacy expectations); adjust the platform branch in `rc.ts` if your wrapper differs.

## Usage

Bootstrap once on app start — resolves the consent zone and opens the banner when consent is required:

```ts
import { rc } from '@/analytics/rc'

onMount(rc)
```

Mount the loaders and banner near the app root. `<Analytics>` injects the gtag.js / gtm.js loaders and fires a `page_view` on every SPA navigation; `<Consent>` renders the banner while consent is pending:

```svelte
<script lang="ts">
  import { Analytics, Consent } from '@/analytics/ui'
  import { page } from '$app/state'
</script>

<svelte:head>
  <Analytics title={page.data.title ?? document.title} />
</svelte:head>

<Consent />
```

Declare your domain's events by augmenting the open `Events` interface — keeping event names and parameter types owned by the domain that fires them (dependency direction domain → analytics). `@/analytics` itself owns only `page_view` and `purchase`:

```ts
// src/@/your-domain/svc/events.ts
declare module '@/analytics' {
  interface Events {
    sign_up: { method: 'passkey' | 'password' | 'google' | 'apple' }
  }
}
```

Then fire it, type-checked, from anywhere:

```ts
import { track } from '@/analytics'

track('sign_up', { method: 'passkey' })
```

## Props

### `<Analytics>`

| Prop    | Type     | Default | Notes                                                                        |
| ------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `title` | `string` | —       | Resolved page title sent with each `page_view` (avoids the SPA title race).  |

### `<Consent>` / `<Manage>`

No props — both read the consent stores directly. `<Consent>` shows the banner while consent is pending; `<Manage>` renders only inside a prior-consent zone once a choice has been made.
