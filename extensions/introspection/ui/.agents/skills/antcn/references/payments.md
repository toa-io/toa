# payments

Subscription paywall stack: a tier selector, animated benefits table, pay button, platform-mandated legal disclaimers, and a processing overlay, backed by four payment processors (App Store, Google Play, Stripe, a dev mock) behind one `Processor` interface. Ships a neutral SaaS example (Storage / Seats / Priority / API) you adapt to your product.

## `$config`

| Field    | Used by                                                                                   |
| -------- | ----------------------------------------------------------------------------------------- |
| `origin` | All three live processors resolve their backend endpoints through `@/net`'s `origin`, which reads `$config.origin`. |

The App Store / Google Play processors transact through the native shell (`@/bridge`); the dev processor stands in whenever `$app/environment`'s `dev` is true and there is no native host. No other `$config` field is read.

## Entitlements

`tier` is the only entitlement the shipped UI reads. Everything else in `Entitlements` is a neutral example you replace with your product's metered (`number`) and flag (`boolean`) entitlements — edit the interface in `svc/entitlements.ts`:

```ts
export interface Entitlements {
  tier: Tier
  seats: number      // metered → gated by usage(account, 'seats') >= seats
  storage: number    // metered
  priority: boolean  // flag → gated by the boolean itself
}
```

`cant(account, key?)` gates generically off the value type — no per-key `switch`:

- no `key` → `true` unless the account has unexpired premium.
- `boolean` entitlement → `true` when the flag is off.
- `number` entitlement → `true` when summed usage (`account.usage`) has reached the limit.
- anything else (e.g. the `tier` string) → never gated.

`usages()` (the `Entitlements` UI) derives one usage bar per **numeric** entitlement automatically, so adding/removing a metered key needs no UI change. When you rename a key, add a matching `used.<key>` and `benefits.<key>` entry to the intl mount.

The account shape is `AccountLike` (`id`, optional `premium`, `processor`, `interval`, `entitlements`, `usage`) — a structural subset of your identity account; pass your `@/iam` account (or any object satisfying it) to `cant`/`usages`/the UI. `interval` is the account's current billing period as an ISO-8601 duration (`P1M`/`P1Y`); the paywall reads it to preselect the matching interval tab.

## Tiers

The upgrade ladder is `tiers = ['basic', 'premium', 'expert']` in `svc/tier.ts` (`rank()` orders upgrades off it). Override it by editing that array in place — there is no config hook. Keep the `tier` values, the `Entitlements.tier` type, the `groups`/`plans` intl keys, and your store product groups in sync with it.

## Notes

- **Products come from the store, not this Solution.** Each processor fetches its own catalog: App Store / Google Play via the native bridge over a fixed set of product IDs (`<tier>_<month|year>`, edit the `IDS` array per processor), Stripe via `GET /stripe/checkout/products`. The dev processor serves the static `svc/processors/dev/products.ts` list so the paywall renders with no backend. Align your store product IDs / Stripe price `metadata.tier` with your `tiers`.
- **Backend endpoints.** Live processors call, under `$config.origin`: `POST/PATCH /appstore/transactions/{id}`, `POST /googleplay/transactions/{id}`, `GET /stripe/checkout/products`, `POST /stripe/checkout/{id}` (+ `/{id}/portal`), `POST /stripe/transactions/{id}`. You implement these.
- **Stripe return.** Stripe checkout redirects back to `#stripe={CHECKOUT_SESSION_ID}`; `rc()` reads that one-shot hash through `@/fragments` and commits the transaction behind the processing overlay. Call `rc()` once on app start.
- **Google Play package id.** `svc/processors/googleplay/processor.ts` builds the manage-subscription URL from a placeholder `com.example.twa` — replace it with your Trusted Web Activity package id (the same one you set in `@/bridge`).
- **Analytics.** The processors emit `checkout` / `purchase` events through `@/analytics`; `Payguard` emits `paywall`. `analytics.d.ts` augments the analytics `Events` interface with the `paywall` / `checkout` shapes.
- **Legal copy & links.** The disclaimers are neutral, store-compliant defaults; `Legal.svelte` links to `/terms/` and `/privacy/` — point them at your pages. Ships its own svintl mount in the registry's four locales; after install reconcile it: `npx intl import payments src/@/payments/ui/intl`.

## Usage

Commit a pending Stripe return once on app start, then drop the paywall behind anything that needs premium:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { rc } from '@/payments/rc'
  import { Payguard, Entitlements } from '@/payments/ui'
  import { Button } from '$ui/button'
  import { account } from '@/iam'

  onMount(rc)
</script>

<!-- gates the action: opens the paywall when the account can't use `seats` -->
<Payguard entitlement="seats">
  <Button>Invite a teammate</Button>
</Payguard>

{#if $account}
  <Entitlements account={$account} />
{/if}
```

`<Paywall>` is the full-screen plan picker `<Payguard>` opens; mount it directly when you want a standalone pricing page.

## Props

### `Payguard`

| Prop          | Type                   | Default | Notes                                                                       |
| ------------- | ---------------------- | ------- | --------------------------------------------------------------------------- |
| `children`    | `Snippet`              | —       | The gated trigger; rendered as-is when the account already has entitlement. |
| `entitlement` | `keyof Entitlements`   | —       | When set, gates on that specific entitlement; omit to gate on premium only. |
| `crown`       | `boolean`              | `true`  | Show the crown badge on the gated trigger.                                  |
| `class`       | `ClassValue`           | —       | Forwarded to the trigger button.                                            |

### `Paywall`

| Prop         | Type         | Default | Notes                                  |
| ------------ | ------------ | ------- | -------------------------------------- |
| `oncomplete` | `() => void` | —       | Fired after a successful checkout or dismissal. |

### `Entitlements`

| Prop      | Type          | Default | Notes                                                  |
| --------- | ------------- | ------- | ------------------------------------------------------ |
| `account` | `AccountLike` | —       | Renders the current plan, usage bars, and manage/upgrade action. |
| `class`   | `ClassValue`  | —       | Root class.                                            |
