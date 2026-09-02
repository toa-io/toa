# Shell

## Notes

`Screen` and `Nav` lay out against `env(safe-area-inset-*)`, which stays zero unless the viewport opts in. Add `viewport-fit=cover` to the viewport meta in `src/app.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

Safari 26 on iOS also keeps its bottom toolbar translucent only while page content reaches the bottom edge — `Nav` holds itself 6px above it for that.

## Usage

Root layout with section nav:

```svelte
<script lang="ts">
  import { Screen, Nav, type Section } from '$com/shell'
  import { House } from '@lucide/svelte'

  const sections: Section[] = [
    { id: 'home', href: '/', label: 'Home', Icon: House },
  ]

  let { children } = $props()
</script>

<Screen>
  {@render children()}
  <Nav {sections} underlay />
</Screen>
```

Nested route — show back instead of tabs:

```svelte
<script lang="ts">
  import { Return } from '$com/shell'
</script>

<Return href=".." />
```

## `back` / `jump`

History-aware navigation for nested routes and editors. Both use the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) session stack; when the stack cannot satisfy the request, they fall back to SvelteKit `goto(href)`.

**Why not plain `goto`?** A SPA that pushes a new history entry on every screen builds a long back chain. Users expect Back to undo their recent steps (and to keep scroll position / in-app transitions). `back` and `jump` prefer real history moves so the browser — and your shell — behave like a native app.

### `back(href)`

Go back one step when possible; otherwise navigate to `href`.

Use when closing a nested screen, cancelling an editor, or deleting an item — anywhere `<Return href="…" />` would go, but triggered from code:

```svelte
<script lang="ts">
  import { back } from '$com/shell'

  async function onDelete() {
    await deleteItem(id)
    await back(`/items/${parentId}/`)
  }
</script>
```

If the user landed via deep link (nothing to pop), `back` opens `href` instead of doing nothing.

### `jump(href)`

Return to a URL already visited earlier in this session — without pushing another entry.

Walks the session history backwards, finds the nearest prior entry whose path matches `href`, and calls `history.go(-n)`. If no match (or the match is too far back), falls back to `goto(href)`.

Use after save/complete when the target list or detail page is already on the stack — e.g. editor → save → land on the list the user came from, skipping intermediate steps:

```svelte
<script lang="ts">
  import { jump } from '$com/shell'

  async function onSaved() {
    await save(data)
    await jump('/contacts/')
  }
</script>
```

Typical split: **`back`** for “undo my last navigation” (one step, parent route); **`jump`** for “take me to that earlier screen” (possibly several steps, exact URL).

## Exports

| Export         | Role                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| `Screen`       | Page wrapper with safe-area insets and optional iOS status-bar underlay |
| `Header`       | Sticky top bar with blur                                                |
| `Nav`          | Fixed bottom bar: sections, back, toolbar                               |
| `Return`       | Registers a back button in `Nav` for the current route                  |
| `Actions`      | Registers toolbar snippets in `Nav`                                     |
| `Attention`    | Small constructive dot (e.g. unseen badge on nav item)                  |
| `Underlay`     | Gradient fade under fixed chrome                                        |
| `Sticky`       | Sticky top/bottom bar over a blurred `Underlay` (e.g. a pinned action bar) |
| `Section`      | Type for nav tab config                                                 |
| `back`, `jump` | History-aware navigation — see above                                    |

## Nav sections

Each `Section` has `id`, `href`, `label`, `Icon` (Lucide component), optional `nested` path prefixes, optional `unseen` badge.

When the current path is nested under an active section, other tabs collapse and a back chevron returns to the section root.

## Props

### `Screen`

| Prop       | Type      | Default | Notes                            |
| ---------- | --------- | ------- | -------------------------------- |
| `underlay` | `boolean` | `true`  | iOS status-bar gradient underlay |
| `unsafe`   | `boolean` | `false` | Skip safe-area padding           |

### `Nav`

| Prop       | Type                           | Default   | Notes                               |
| ---------- | ------------------------------ | --------- | ----------------------------------- |
| `sections` | `Section[]`                    | `[]`      | Bottom tab config                   |
| `position` | `'start' \| 'center' \| 'end'` | `'start'` | Toolbar side; also flips bar layout |
| `underlay` | `boolean`                      | `false`   | Gradient fade behind the bar        |

### `Return`

| Prop   | Type     | Default | Notes                                          |
| ------ | -------- | ------- | ---------------------------------------------- |
| `href` | `string` | `'..'`  | Passed to `back()` when history cannot go back |

### `Actions`

| Prop     | Type                | Default | Notes                                        |
| -------- | ------------------- | ------- | -------------------------------------------- |
| `active` | `Writable<boolean>` | —       | When true, fades nav items (e.g. modal open) |
