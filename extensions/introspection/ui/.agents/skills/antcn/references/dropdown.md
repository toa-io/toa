# Dropdown

Composable action menu with CSS anchor positioning, view-transition morph on open/close, and optional nested layers. Import as a namespace (`import * as Dropdown from '$com/dropdown'`).

## Usage

### Basic

```svelte
<script lang="ts">
  import { Ellipsis } from '@lucide/svelte'
  import * as Dropdown from '$com/dropdown'

  let menu: Dropdown.Root | undefined
</script>

<Dropdown.Root bind:this={menu}>
  <Dropdown.Trigger variant="outline" size="icon">
    <Ellipsis />
  </Dropdown.Trigger>
  <Dropdown.Content>
    <Dropdown.Group direction="col">
      <Dropdown.Item onclick={() => menu?.close()}>Edit</Dropdown.Item>
      <Dropdown.Item>More…</Dropdown.Item>
    </Dropdown.Group>
  </Dropdown.Content>
</Dropdown.Root>
```

### Nested layers

Initially layers with `name` are hidden. Items with `layer` push a named layer. `Back` pops the current layer.

```svelte
<script lang="ts">
  import { Ellipsis } from '@lucide/svelte'
  import * as Dropdown from '$com/dropdown'

  let menu: Dropdown.Root | undefined
</script>

<Dropdown.Root bind:this={menu}>
  <Dropdown.Trigger variant="outline" size="icon">
    <Ellipsis />
  </Dropdown.Trigger>
  <Dropdown.Content>
    <Dropdown.Layer>
      <Dropdown.Group direction="col">
        <Dropdown.Item onclick={() => menu?.close()}>Edit</Dropdown.Item>
        <Dropdown.Item layer="more">More…</Dropdown.Item>
      </Dropdown.Group>
    </Dropdown.Layer>
    <Dropdown.Layer name="more">
      <Dropdown.Group direction="col">
        <Dropdown.Back />
        <Dropdown.Item onclick={() => menu?.close()}>Archive</Dropdown.Item>
      </Dropdown.Group>
    </Dropdown.Layer>
  </Dropdown.Content>
</Dropdown.Root>
```

### Actions

Typical use case for Dropdown is navigation actions.
Wrap it with `<Actions>` from `shell` component, pass `active` store to control mute of the main navigation.

```svelte
<script lang="ts">
  import { writable } from 'svelte/store'
  import { Actions } from '$com/shell'
  import * as Dropdown from '$com/dropdown'

  const active = writable(false)
</script>

<Actions active={active}>
  <Dropdown.Root bind:this={menu} onopen={(open) => active.set(open)}>
    <Dropdown.Trigger variant="outline" size="icon">
      <Ellipsis />
    </Dropdown.Trigger>
    <Dropdown.Content>
      <Dropdown.Group direction="col">
        <Dropdown.Item onclick={() => menu?.close()}>Edit</Dropdown.Item>
        <Dropdown.Item>More…</Dropdown.Item>
      </Dropdown.Group>
    </Dropdown.Content>
  </Dropdown.Root>
</Actions>
```

## Props

### Root

| Prop       | Type                      | Default | Notes                                      |
| ---------- | ------------------------- | ------- | ------------------------------------------ |
| `children` | `Snippet`                 | —       | `Trigger` and `Content` slots.             |
| `onopen`   | `(open: boolean) => void` | —       | Fires when open state changes.             |

**Methods** (via `bind:this`): `open()`, `close()`.

### Trigger

Extends shadcn `Button` props (`variant`, `size`, `class`, …).

| Prop       | Type      | Default | Notes                                |
| ---------- | --------- | ------- | ------------------------------------ |
| `children` | `Snippet` | —       | Trigger label or icon.               |
| `id`       | `string`  | —       | Passed to the underlying `Button`.   |

### Content

| Prop       | Type                                                                 | Default         | Notes                                                                 |
| ---------- | -------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------- |
| `children` | `Snippet`                                                            | —               | `Layer`, `Group`, `Item`, `Separator` slots.                          |
| `class`    | `ClassValue`                                                         | —               | Panel wrapper classes.                                                |
| `position` | `'start-top' \| 'start-bottom' \| 'end-top' \| 'end-bottom'`         | `'end-bottom'`  | Corner where menu aligns with the trigger; menu grows outward from it. |

### Layer

| Prop       | Type      | Default | Notes                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------- |
| `name`     | `string`  | `''`    | Layer id. Default layer uses `''`; push targets use a non-empty name. |
| `children` | `Snippet` | —       | Shown when this layer is active.                                      |

### Group

| Prop        | Type               | Default | Notes                                      |
| ----------- | ------------------ | ------- | ------------------------------------------ |
| `children`  | `Snippet`          | —       | `Item` or custom content.                  |
| `direction` | `'col' \| 'row'`   | `'col'` | Layout for items; affects `itemVariants`.  |
| `class`     | `ClassValue`       | —       | Wrapper classes.                           |

### Item

Extends shadcn `Button` props. Export `itemVariants` for custom buttons in a row group.

| Prop       | Type      | Default   | Notes                                                         |
| ---------- | --------- | --------- | ------------------------------------------------------------- |
| `children` | `Snippet` | —         | Row content (icon + label).                                   |
| `layer`    | `string`  | —         | When set, click pushes this layer instead of calling `onclick`. |
| `variant`  | `string`  | `'ghost'` | Button variant.                                               |

### Back

Same props as `Item` except `onclick` / `layer` (handled internally). Optional label snippet after the back arrow.

### Separator

| Prop       | Type      | Default | Notes                              |
| ---------- | --------- | ------- | ---------------------------------- |
| `children` | `Snippet` | —       | Optional centered label between rules. |
