# Panel

List row built on shadcn `Button`: main content in `left`/`right`/`icon` snippets, optional swipe-reveal `actions` on the trailing edge. Set `h` (e.g. `h-14`) when using `collapsed` — height animates to zero. Pass `selected` for accent ring styling (from `globals`).

## Usage

```svelte
<script lang="ts">
  import { Panel, type Action } from '$com/panel'

  const actions: Action[] = [{ id: 'delete', onclick: () => remove() }]
</script>

<Panel h="h-14" class="bg-card border border-border" href="/items/1">
  {#snippet left()}
    <span class="font-medium">Item title</span>
  {/snippet}
  {#snippet right()}
    <span class="text-muted-foreground">$12</span>
  {/snippet}
  {#snippet action(id)}
    {#if id === 'delete'}Delete{/if}
  {/snippet}
  {actions}
</Panel>
```

## Props

| Prop        | Type                         | Default     | Notes                                                                 |
| ----------- | ---------------------------- | ----------- | --------------------------------------------------------------------- |
| `left`      | `Snippet`                    | —           | Main label/content (required).                                        |
| `right`     | `Snippet`                    | —           | Trailing slot (balance, badge, etc.).                                 |
| `icon`      | `Snippet`                    | —           | Leading icon/avatar before `left`.                                    |
| `collapsed` | `boolean`                    | `false`     | Animate height to zero. Requires `h`.                                 |
| `selected`  | `boolean`                    | `false`     | Applies `.selected` ring styling.                                     |
| `h`         | `string`                     | —           | Tailwind height class on the row and collapse wrapper.                |
| `actions`   | `Action[]`                   | —           | Swipe-reveal toolbar items. Pair with `action` snippet.               |
| `action`    | `Snippet<[string]>`          | —           | Renders one action by `id`. Required when `actions` is set.           |
| `variant`   | `ButtonVariant`              | `'outline'` | Forwarded to shadcn `Button`.                                         |

`Action`: `{ id, class?: ClassValue, href?, onclick? }` — tapping an action scrolls the row back; `href` navigates via SvelteKit `goto`.

All other props pass through to the underlying `Button` (`href`, `onclick`, `class`, etc.).
