# Tools

Small Svelte/TypeScript utilities — formatters, reactive helpers, browser glue, view transitions. Installs to `$lib/tools/` with barrel `index.ts`.

```sh
npx shadcn-svelte add https://cn.ants.dev/r/tools.json
```

```ts
import { ago, date, navigate, ios } from '$lib/tools'
```

Most modules need only an import. Below: app-wide setup the CLI cannot merge.

## Transitions (`transition.ts`)

View Transition API helpers for SvelteKit navigation and in-page morphs.

| Export | Role |
| --- | --- |
| `navigate` | Pass to SvelteKit `onNavigate` — wraps route changes in `document.startViewTransition` |
| `transit` | Manual `startViewTransition` wrapper (async callback optional) |
| `takeoff` | Before navigation, pin a departing element by `id` + transition name |
| `transition` | Svelte action for non-navigation morphs |
| `styles` | Store of inline `view-transition-*` style while a non-nav transition runs |

### Route transitions — wire once in root layout

CSS alone (`view-transition-name`, antcn `globals` layers) does **not** start transitions. Hook SvelteKit navigation:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onNavigate } from '$app/navigation'
  import { navigate } from '$lib/tools'

  let { children } = $props()

  onNavigate(navigate)
</script>

{@render children()}
```

Required for route morphs (e.g. `shell` nav). Without this, transition CSS is inert. Unsupported browsers no-op (`transit` runs the callback immediately).

### Shared CSS

Antcn components using `transition-morph` / `standalone:` / `constructive` need `globals` (pulled in by `shell`) — see **globals** (`globals.md`).

### Named morphs across navigation

```ts
import { takeoff } from '$lib/tools'

takeoff('my-avatar', 'avatar', 'transition-morph')
await goto('/profile')
```

### In-page (no navigation)

```svelte
<div use:transition={{ name: 'panel', classes: 'transition-morph' }}>...</div>
```

```ts
await transit(async () => { /* DOM updates */ })
```
