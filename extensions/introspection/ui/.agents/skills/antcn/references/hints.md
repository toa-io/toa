## hint

Per-account dismissable onboarding hints — acknowledge a hint permanently, or snooze it until a timestamp. State is persisted under the signed-in `@/iam` account, so each user sees each hint once (or once per snooze window).

`Hints` is intentionally an **empty interface extending `Record<string, Hint | undefined>`**. Declare your hint keys by extending it; `acknowledge` / `later` / `unfamiliar` then narrow to those keys.

## Notes

- **Requires `@/iam`.** The hint store binds to `@/iam`'s `account` and clears on logout — no account, no persisted hints. Pulled automatically via `local:iam`.
- **No UI ships.** This Solution is service-only; render the prompt with whatever surface you like (a `Card`, banner, dialog). `unfamiliar(key)` gates rendering; `acknowledge` / `later` dismiss it.
- **Extending `Hints` is how you wire keys.** Without an `interface Hints` augmentation in your project, every key is valid but untyped. The `transmission` Solution does this for `transmission_permission`.

## Usage

Declare a hint key, then gate a prompt on `unfamiliar`:

```ts
// src/@/your-feature/svc/hints.ts
import type { Hint } from '@/hints'

declare module '@/hints' {
  interface Hints {
    welcome?: Hint
  }
}
```

```svelte
<script lang="ts">
  import { unfamiliar, acknowledge, later } from '@/hints'

  const day = 24 * 60 * 60 * 1000
</script>

{#if unfamiliar('welcome')}
  <Card>
    <p>Welcome aboard.</p>
    <Button onclick={() => later('welcome', 7 * day)}>Later</Button>
    <Button onclick={() => acknowledge('welcome')}>Got it</Button>
  </Card>
{/if}
```

`unfamiliar(key)` returns `true` when there is no record for `key` **or** the record is a snooze (`value: false`) whose `expiration` has passed. `acknowledge(key)` writes `{ value: true }` (hides forever). `later(key, delay)` writes `{ value: false, expiration: Date.now() + delay }` (hides until then).
