# iam

Identity & access — a complete authentication surface plus the services behind it. UI covers passkey, password, one-time-passcode, and OIDC (Google/Apple) sign-in/sign-up, an `Authenticated` gate, an `Authorized` conditional-render guard, and session refresh on expiry. Services expose the `account` store, `logout`, `update`, `named`, and the `basic` / `otp` / `passkeys` / `oidc` flows.

## `$config`

| Field              | Type                | Notes                                                |
| ------------------ | ------------------- | ---------------------------------------------------- |
| `navigation.entry` | `{ entry: string }` | Route to land on after a successful OIDC redirect.   |

Network access (`origin`, `sleep`) flows through `@/net`.

## Environment

OIDC client IDs come from `$env/dynamic/public`. Omit or leave empty to hide the provider button:

| Var                       | Notes                                              |
| ------------------------- | -------------------------------------------------- |
| `PUBLIC_GOOGLE_CLIENT_ID` | Google OIDC client ID. Empty hides the Google button. |
| `PUBLIC_APPLE_CLIENT_ID`  | Apple OIDC client ID. Empty hides the Apple button.  |

## Notes

- **OIDC is opt-in.** Missing/empty `PUBLIC_*_CLIENT_ID` disables the provider buttons — no wiring crashes if you only want password/passkey/OTP.
- **Account shape.** Components accept an `AccountLike` (`Pick` of the account fields they render); the `account` store holds the authenticated `Echo`. Extend `Echo` (`svc/net/Echo.ts`) if your API returns extra profile fields.
- **`Credentials` manager.** Renders the signed-in account's security surface: a passkey manager (register / list / hold-to-delete — a thin layer over `@/passkeys`), inert provider rows (email/Google/Apple; the `Connect` CTA carries no behaviour yet), and a "sign in on another device" action whose QR encodes the current session `challenge`. It gates itself on the `account` store, so just mount it anywhere inside your authenticated area.
- **Session transfer is two-sided.** The QR is the *sending* device; the *receiving* device adopts the session by reading the fragment `challenge` on load. `rc()` already does this on init (shared `consume()`), so transfer completes as long as `rc()` runs once at app start.

## Usage

Gate an app behind authentication (`Authenticated` shows the auth surface until signed in, then renders its children):

```svelte
<script lang="ts">
  import { Authenticated } from '@/iam/ui'
</script>

<Authenticated>
  <Dashboard />
</Authenticated>
```

Conditionally render UI with `Authorized`. It renders its children only when **at least one** passed check passes: `dev` (matches `$app/environment` `dev`), `beta` (host starts with `beta.`), `debug` (`dev` or `beta`), or `role` (scoped match against the account's `roles` — `app` matches `app`, `app:codes`, and deeper; `app:codes` matches only `app:codes` and deeper). No matching check → nothing renders.

```svelte
<script lang="ts">
  import { Authorized } from '@/iam/ui'
</script>

<Authorized role="admin">
  <AdminPanel />
</Authorized>

<Authorized dev>
  <DebugToolbar />
</Authorized>
```

Read the session reactively and sign out. `account` is a `svas` store of the authenticated `Echo` (`null` when signed out):

```svelte
<script lang="ts">
  import { account, logout } from '@/iam'
  import { goto } from '$app/navigation'

  async function getout() {
    logout()
    void goto('/')
  }
</script>

{#if $account}
  <p>Signed in as {$account.name}</p>
  <button onclick={getout}>Log out</button>
{/if}
```

Block an action until the account has a display name — `named()` resolves once `account.name` is set (prompting through the auth surface if missing), so guarded flows can `await` it:

```ts
import { having } from 'svas'
import { account, named } from '@/iam'

async function onaccept() {
  await having(account) // wait for a session
  await named() // …and a chosen name
  await invitations.accept(id)
}
```

Patch the local session optimistically (e.g. after a profile edit) — `update` merges a partial into the `account` store without a round-trip:

```ts
import { update } from '@/iam'

update({ name: 'Ada Lovelace' })
```

Gate non-UI logic on the `authenticated` derived boolean (true only when a challenge + account exist and nothing is processing):

```ts
import { authenticated } from '@/iam'

authenticated.subscribe((ok) => ok && sync())
```

Render the account's credentials manager inside an authenticated area (passkeys, connected providers, device transfer). It only renders once a session exists, so no extra gating is needed:

```svelte
<script lang="ts">
  import { Credentials } from '@/iam/ui'
</script>

<Credentials />
```

`Credentials` takes a single optional `class` (`ClassValue`) — everything else is driven by the `account` and `@/passkeys` stores.
