# Share

Invokes the Web Share API when `navigator.share` exists; otherwise renders `Clipboard` with the share URL so desktop users can still copy the link.

`data` may be a `ShareData` object or an async retriever (e.g. fetch an invite URL first). Returns early when the retriever resolves to `null`.

## Usage

```svelte
<script lang="ts">
  import { Share } from '$com/share'

  const data = { title: 'Join me', url: 'https://example.com/join/abc' }
</script>

<Share {data} label="Share invite" variant="outline" />
```

## Props

| Prop      | Type                                      | Default | Notes                                                        |
| --------- | ----------------------------------------- | ------- | ------------------------------------------------------------ |
| `data`    | `ShareData \| () => Promise<ShareData \| null>` | —       | Payload for `navigator.share`. Retriever may return `null`.   |
| `label`   | `string`                                  | —       | Button label when no `children` snippet.                     |
| `onshare` | `() => void`                              | —       | Fires after share (or clipboard fallback copy).              |
| `children`| `Snippet`                                 | —       | Custom button content; replaces icon + label.                |

All other props pass through to the underlying `Button` (or `Clipboard` on unsupported browsers).
