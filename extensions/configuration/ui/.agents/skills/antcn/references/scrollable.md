# Scrollable

Horizontal snap scroller with optional infinite loop and programmatic scroll-to-index. Give each child `snap-center` or `snap-start` (and fixed width) for predictable snapping.

## Usage

```svelte
<script lang="ts">
  import { Scrollable } from '$com/scrollable'

  let index = $state(0)
  const items = ['One', 'Two', 'Three']
</script>

<Scrollable scroll={index} class="gap-2">
  {#each items as item, i (item)}
    <button class="snap-center shrink-0 rounded-lg border px-4 py-2" onclick={() => (index = i)}>
      {item}
    </button>
  {/each}
</Scrollable>
```

## Props

| Prop         | Type                     | Default   | Notes                                                                 |
| ------------ | ------------------------ | --------- | --------------------------------------------------------------------- |
| `children`   | `Snippet`                | —         | Scroll items. Duplicated internally when `infinite` is true.          |
| `infinite`   | `boolean`                | `false`   | Loop by cloning children; recenters on `scrollend`.                   |
| `align`      | `'start' \| 'center'`    | `'start'` | How `scroll` index is positioned.                                     |
| `scroll`     | `number`                 | `0`       | Child index to scroll to. Use `-1` to skip initial scroll.            |
| `bleed`      | `boolean`                | `false`   | Break out to full viewport width (edge-to-edge carousel).             |
| `gutter`     | `boolean`                | `false`   | Half-track end gutters so the first/last item can sit dead-center. Pairs with `align="center"`; ignored when `infinite`. |
| `controlled` | `boolean`                | `false`   | Hide native overflow; drive scroll externally.                        |
| `dir`        | `'ltr' \| 'rtl'`         | —         | Direction on the outer container.                                     |
| `class`      | `ClassValue`             | —         | Classes on the scroll track (gap, padding, etc.).                     |
| `style`      | `string`                 | —         | Inline style on the outer container.                                  |
| `id`         | `string`                 | —         | Id on the scroll track.                                               |
| `onscroll`   | `(e: Event) => void`     | —         | Scroll handler on the track.                                        |
