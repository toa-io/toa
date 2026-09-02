# Dismissable

Horizontal swipe-to-dismiss wrapper with optional slide-out animation. Swiping far enough triggers `ondismiss` immediately; calling `dismiss()` on a bound instance plays the slide-out first, then `ondismiss`. `remove()` animates out without calling `ondismiss`.

Set `dismissable={false}` to disable the swipe sentinel — use when dismissal is programmatic only.

## Usage

### Swipe to dismiss

```svelte
<script lang="ts">
  import { Dismissable } from '$com/dismissable'

  let visible = $state(true)

  async function ondismiss() {
    visible = false
  }
</script>

{#if visible}
  <Dismissable {ondismiss}>
    <div class="rounded-lg border bg-muted px-4 py-3">Swipe left to dismiss</div>
  </Dismissable>
{/if}
```

### Clear all

Bind each row, call `remove()` on every ref with a short stagger (`delay` from `$lib/tools`), then drop them from state — `remove()` skips per-row `ondismiss`.

```svelte
<script lang="ts">
  import { Dismissable } from '$com/dismissable'
  import { delay } from '$lib/tools'

  type Ref = { remove: () => Promise<void> | void }

  let items = $state(['One', 'Two', 'Three'])
  const refs = $state<Array<Ref | undefined>>([])

  async function clearAll() {
    const removed = refs.map((ref, i) => delay(() => ref?.remove(), i * 50))

    await Promise.all(removed)
    items = []
  }
</script>

<button onclick={clearAll}>Clear all</button>

{#each items as item, i (item)}
  <Dismissable bind:this={refs[i]} ondismiss={() => (items = items.filter((x) => x !== item))}>
    <div class="rounded-lg border bg-muted px-4 py-3">{item}</div>
  </Dismissable>
{/each}
```

## Props

| Prop          | Type                              | Default | Notes                                                                 |
| ------------- | --------------------------------- | ------- | --------------------------------------------------------------------- |
| `children`    | `Snippet`                         | —       | Content inside the swipe track.                                       |
| `ondismiss`   | `() => Promise<void> \| void`     | —       | Swipe-to-sentinel fires immediately; `dismiss()` fires after animation. |
| `dismissable` | `boolean`                         | `true`  | When `false`, hides the swipe sentinel and disables swipe dismissal.  |

## Instance methods

Bind with `bind:this` to call programmatic dismissal:

| Method     | Notes                                                          |
| ---------- | -------------------------------------------------------------- |
| `dismiss()` | Slide-out animation, then `ondismiss`.                        |
| `remove()`  | Slide-out animation only — no `ondismiss`.                    |
