# Clipboard

Copies `text` (string or async retriever) to the system clipboard. Shows a checkmark for 2s after success. Disabled when `navigator.clipboard` is unavailable (non-secure context).

## Usage

```svelte
<script lang="ts">
  import { Clipboard } from '$com/clipboard'
</script>

<Clipboard text="https://example.com/join/abc" label="Copy link" variant="outline" />
```

## Props

| Prop     | Type                         | Default | Notes                                              |
| -------- | ---------------------------- | ------- | -------------------------------------------------- |
| `text`   | `string \| () => Promise<string>` | —       | Value to copy. Retriever may return `null` to skip. |
| `label`  | `string`                     | —       | Button label. Omit for icon-only.                  |
| `oncopy` | `() => void`                 | —       | Fires after a successful copy.                     |

All other props pass through to the underlying `Button`.
