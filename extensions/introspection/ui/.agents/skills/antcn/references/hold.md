# Hold

`Alt`+click fires `onclick` immediately (power users / tests). Right-click is swallowed.

Use a unique `name` per instance when several holds share a page (CSS anchor). Set `portal={false}` inside transformed ancestors — Safari CSS anchor positioning quirk.

## Usage

```svelte
<script lang="ts">
  import { Hold } from '$com/hold'
</script>

<Hold label="hold to log out" onclick={() => signOut()}>
  Log out
</Hold>
```

## Props

| Prop       | Type                                              | Default   | Notes                                                                        |
| ---------- | ------------------------------------------------- | --------- | ---------------------------------------------------------------------------- |
| `name`     | `string`                                          | `'hold'`  | CSS anchor name. Use a unique value per instance if multiple on one page.    |
| `duration` | `number` (ms)                                     | `800`     | How long the user must hold before `onclick` fires.                          |
| `label`    | `string`                                          | —         | Hint text shown in the tooltip while held. Use `message` snippet for richer markup. |
| `message`  | `Snippet`                                         | —         | Overrides `label` for non-string content.                                    |
| `position` | `'center' \| 'left' \| 'right' \| 'top' \| 'bottom'` | `'left'`  | Tooltip side (CSS anchor `position-area` first axis).                        |
| `align`    | `'center' \| 'left' \| 'right' \| 'top' \| 'bottom'` | `'center'` | Tooltip alignment along the chosen side.                                     |
| `portal`   | `boolean`                                         | `true`    | Teleport tooltip to `body`. Set `false` inside transformed ancestors (Safari anchor quirk). |
| `onpress`  | `() => void`                                      | —         | Fires when the hold starts.                                                  |
| `onclick`  | `() => void`                                      | —         | Fires after the full duration is held, or immediately on `Alt`+click.        |
| `variant`  | `ButtonVariant`                                   | `'ghost'` | Forwarded to shadcn `Button`.                                                |

All other props pass through to the underlying `Button`.
