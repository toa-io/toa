# fragments

## Notes

- **Mount `<Fragments />` once** in your root `+layout.svelte`. It runs on the first (landing) navigation only and drives the consume-on-read cleanup; without it, read values are never stripped from the hash.
- `fragment(name)` returns the value present in the landing URL's hash, or `null` when absent. The hash is snapshotted once at module load, so reads are stable across the session even as the bar is rewritten; the actual URL is cleaned on the next navigation.
- SSR-safe: on the server the hash is empty, so `fragment()` returns `null` and `<Fragments />` is inert until hydration.

## Usage

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { Fragments } from '@/fragments/ui'
</script>

<Fragments />
{@render children()}
```

```ts
// anywhere a one-shot hash value is expected, e.g. a returning redirect
import { fragment } from '@/fragments'

const session = fragment('stripe')
if (session) {
  // …resume the flow for this session id; the hash is cleaned on next navigation
}
```
