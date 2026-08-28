# passkeys

WebAuthn credential management — registers, lists, and removes passkeys for the signed-in account against your `/identity/passkeys` API. Wraps the browser `navigator.credentials` ceremony (challenge → `create`/`get` → attestation) so callers work with plain async operations that return values or `Error`.

## Notes

- **Requires `@/iam`.** The `passkeys` store keys credentials by the current `@/iam` `account`; `get`/`remove`/`store` all read it. No signed-in account → empty store. `iam` is **not** pulled automatically (that would form an install cycle — `iam` already depends on `passkeys`), so install it yourself: `npx shadcn-svelte add http://cn.ants.dev/r/iam.json`. Installing `iam` brings `passkeys` along, so most consumers never add `passkeys` directly.
- **Feature detection.** `supported` is a boolean (`window.PublicKeyCredential !== undefined`, `true` on the server). Gate registration UI on it — the ceremony rejects on unsupported browsers.
- **`ui/aaguid.json`** ships the FIDO AAGUID → authenticator-metadata map (name + light/dark icon, base64 SVG). Look up `aaguid[credential.aaguid]` to label a passkey by its authenticator (e.g. "Google Password Manager", "iCloud Keychain"). Optional — nothing imports it for you.

## Usage

```ts
import { supported, add, request, remove, passkeys } from '@/passkeys'

if (supported) {
  const out = await add(identity, name) // full register: ceremony → POST → store
  if (out instanceof Error) handle(out)
}

// reactive list for the current account
passkeys.subscribe((list) => render(list))

await remove(id) // revoke one
```

`request(id?)` runs the authentication (login) ceremony and returns the assertion (`RequestResponse`) for your auth flow to exchange. `create(name, identity?)` is the lower-level ceremony `add` builds on.
