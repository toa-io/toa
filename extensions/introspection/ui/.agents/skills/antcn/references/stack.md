# Stack

Collapsible card stack with view-transition morphs. Click the stack (or press Enter/Space on the root) to expand; bind `collapsed` or call `collapse()` / `expand()` / `toggle()` on a `Root` ref. Each `Item` needs a stable `id` for transition names.

## Usage

```svelte
<script lang="ts">
  import * as Stack from '$com/stack'
  import { Button } from '$ui/button'

  let stack: ReturnType<typeof Stack.Root> | undefined
</script>

<Stack.Root bind:this={stack}>
  {#each items as item (item.id)}
    <Stack.Item id={item.id}>
      <Card>{item.title}</Card>
    </Stack.Item>
  {/each}
  <Stack.Toolbar>
    <Button variant="ghost" size="sm" onclick={() => stack?.collapse()}>Collapse</Button>
  </Stack.Toolbar>
</Stack.Root>
```

## Props

### Root

| Prop        | Type          | Default | Notes                                                                 |
| ----------- | ------------- | ------- | --------------------------------------------------------------------- |
| `children`  | `Snippet`     | —       | `Item` and optional `Toolbar` slots.                                  |
| `collapsed` | `boolean`     | `true`  | Bindable. When true and item count ≥ `min`, cards stack visually.     |
| `min`       | `number`      | `3`     | Minimum items before the stacked collapsed layout applies.            |
| `class`     | `ClassValue`  | —       | Root container classes.                                               |

**Methods** (via `bind:this`): `toggle(on?)`, `expand()`, `collapse()`.

### Item

| Prop       | Type      | Default | Notes                                      |
| ---------- | --------- | ------- | ------------------------------------------ |
| `children` | `Snippet` | —       | Card content.                              |
| `id`       | `string`  | —       | Stable key for `view-transition-name`.     |
| `class`    | `ClassValue`  | —       | Wrapper classes.                           |

### Toolbar

| Prop       | Type         | Default | Notes                                                        |
| ---------- | ------------ | ------- | ------------------------------------------------------------ |
| `children` | `Snippet`    | —       | Shown only when expanded and stacked (≥ `min` items).        |
| `class`    | `ClassValue` | —       | Wrapper classes.                                             |
