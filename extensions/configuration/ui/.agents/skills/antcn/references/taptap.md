# TapTap

Fires `onclick` only after `taps` consecutive presses within `gap` ms. Use the `child` snippet to wrap an existing control; otherwise renders a native `<button>`.

## Usage

```svelte
<script lang="ts">
  import { TapTap } from '$com/taptap'
</script>

<TapTap taps={3} gap={400} onclick={() => confirm()}>
  Tap 3×
</TapTap>
```

## Props

| Prop       | Type                                              | Default    | Notes                                                                 |
| ---------- | ------------------------------------------------- | ---------- | --------------------------------------------------------------------- |
| `taps`     | `number`                                          | `2`        | Consecutive presses required before `onclick` fires.                  |
| `gap`      | `number` (ms)                                     | `500`      | Max interval between presses to count as consecutive.                 |
| `onclick`  | `MouseEventHandler<HTMLButtonElement>`            | —          | Fires after the tap sequence completes.                               |
| `child`    | `Snippet<[{ onclick: () => void; n: number }]>` | —          | Renders instead of the default button; pass `onclick` to your control. `n` is the current position in the sequence (`0` when idle). |
| `children` | `Snippet`                                         | —          | Button content when `child` is omitted.                               |
| `type`     | `HTMLButtonAttributes['type']`                    | `'button'` | Native button type when not using `child`.                            |

All other props pass through to the underlying `<button>` when `child` is omitted.
