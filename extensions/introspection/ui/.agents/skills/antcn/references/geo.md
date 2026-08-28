# geo

Consent-zone lookup. Resolves whether the current visitor sits in a prior-consent jurisdiction (where a consent banner must be shown before loading trackers) by querying your API through the `@/net` origin. Headless — service only, no UI.

## Notes

- **Backend contract** — exposes `geo()`, which `GET`s `/geo/` on your API (resolved against `$config.origin` via `@/net`). The endpoint must answer with `{ "privacy": boolean, "country"?: string }`, where `privacy: true` means the visitor is inside a prior-consent zone. Typically your backend derives this from the request IP / edge geolocation headers.
- **Dev override** — when running in dev, a `?privacy=0|1` query param short-circuits the backend lookup so you can force either branch locally (`?privacy=1` → in-zone, `?privacy=0` → out-of-zone). The override is dev-only and browser-only; production always defers to the API.
- **Failure** — a network/parse failure resolves to an `Error` (not a throw); the caller decides the safe default (typically: show the banner).

## Usage

```ts
import { geo } from '@/geo'

const zone = await geo()

if (zone instanceof Error) {
  // lookup failed — default to the privacy-safe path (show the banner)
} else if (zone.privacy) {
  // prior-consent jurisdiction — collect consent before loading trackers
}
```

## Props

None — this Solution exports a single `geo()` function and the `Geo` type. It renders nothing.
