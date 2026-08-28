# Fullscreen

Tap-to-expand overlay portaled to `body`. Wraps open/close in `transit()` for view transitions. Default mode: `children` is the trigger and the fullscreen body. Use `content` when the trigger and the overlay body should differ.

## Usage

### Zoom a thumbnail

Same markup in the trigger and in fullscreen — good for photo zoom. Put `view-transition-name` on the image; add `fullscreen-content` for correct morph stacking.

```svelte
<script lang="ts">
  import { Fullscreen } from '$com/fullscreen'

  const id = 'photo-1'
  let zoomed = $state<string | null>(null)
</script>

<Fullscreen class="h-[300px]" fragile onshow={() => (zoomed = id)} x={false}>
  <img
    src="/photo.jpg"
    alt=""
    class="h-full object-contain fullscreen-content"
    style={`${zoomed === id ? 'view-transition-name: photo;' : ''} view-transition-class: transition-spring transition-morph;`} />
</Fullscreen>
```

Set the transition name only while open (`onshow` + conditional style) when several Fullscreens sit in a list — otherwise every thumbnail joins the same morph.

### Button → content

When a button (or file input, share target, …) opens different fullscreen UI, split trigger and body: `controlled`, `content`, and `bind:this` → `show()` / `hide()`.

Morph from the button into `content` with `takeoff` + `styles` (same transition name on both sides):

```svelte
<script lang="ts">
  import { Button } from '$ui/button'
  import { styles, takeoff } from '$lib/tools'
  import { Fullscreen } from '$com/fullscreen'

  const morph = 'transition-spring transition-morph fullscreen-content'

  let fullscreen = $state<Fullscreen | null>(null)
  const contentStyle = styles('upload', morph)

  function open() {
    takeoff('upload-button', 'upload', morph)
    fullscreen?.show()
  }
</script>

<Fullscreen bind:this={fullscreen} controlled>
  <Button id="upload-button" onclick={open}>Upload</Button>
  {#snippet content()}
    <div class="max-w-md p-4 fullscreen-content" style={$contentStyle}>
      <!-- progress, preview, … -->
    </div>
  {/snippet}
</Fullscreen>
```

No visible trigger? Pass an empty `<div></div>` as `children` and call `show()` from `onMount` (share-target flow).

### Overlay toolbar

Actions above the content — delete, share, etc. Disable the default ✕ (`x={false}`) when the overlay dismisses.

```svelte
<script lang="ts">
  import { Hold } from '$com/hold'
  import { Fullscreen } from '$com/fullscreen'

  let fullscreen = $state<Fullscreen | null>(null)
</script>

<Fullscreen bind:this={fullscreen} fragile x={false}>
  <img src="/photo.jpg" alt="" class="fullscreen-content" style="view-transition-name: photo; …" />
  {#snippet overlay()}
    <div class="flex justify-end p-4 tim:pt-[env(safe-area-inset-top)]">
      <Hold label="hold to delete" variant="outline" size="icon" onclick={() => fullscreen?.hide()}>
        <!-- icon -->
      </Hold>
    </div>
  {/snippet}
</Fullscreen>
```

### Store-driven open

When `open` comes from a store or parent, still wrap the flip in `transit()` — `show()` / `hide()` do that; raw `open = true` skips the animation.

```svelte
<script lang="ts">
  import { transit } from '$lib/tools'
  import { Fullscreen } from '$com/fullscreen'

  let open = $state(false)

  async function present() {
    await transit(() => (open = true))
  }
</script>

<Fullscreen bind:open>
  <div></div>
  {#snippet content()}
    <!-- paywall, modal flow, … -->
  {/snippet}
</Fullscreen>
```

Optional: `takeoff(sourceId, name, classes)` before `transit` when morphing from another element on the page (CTA button → paywall card).

## Props

| Prop         | Type           | Default | Notes                                                                 |
| ------------ | -------------- | ------- | --------------------------------------------------------------------- |
| `children`   | `Snippet`      | —       | Trigger markup; also fullscreen body when `content` is omitted.       |
| `content`    | `Snippet`      | —       | Fullscreen-only body; trigger stays on the page.                      |
| `overlay`    | `Snippet`      | —       | Toolbar/actions above content; rendered inside `Overlay`.             |
| `open`       | `boolean`      | `false` | Bindable. Mutate inside `transit()` unless using `show()` / `hide()`. |
| `onshow`     | `() => void`   | —       | Fires when `show()` starts.                                           |
| `onhide`     | `() => void`   | —       | Fires after the close transition finishes.                            |
| `class`      | `ClassValue`   | —       | Classes on the trigger button (ignored when `controlled`).            |
| `fragile`    | `boolean`      | `false` | Close on backdrop pointer down.                                       |
| `controlled` | `boolean`      | `false` | No built-in trigger; call `show()` / `hide()` yourself.               |
| `x`          | `boolean`      | `true`  | Top-trailing close button.                                            |

`bind:this` exposes `show()` and `hide()`. `Overlay` accepts `children` and optional `class`.

## Notes

### Opening and closing

- Prefer `show()` / `hide()` or `await transit(() => (open = …))`. Assigning `open` directly bypasses the view transition.
- In `controlled` mode, Escape and backdrop tap (`fragile`) do nothing — close with `hide()`, `transit(() => (open = false))`, or a control in `overlay`.
- Pair `controlled` + `bind:open` when async work should finish only while open: `if (open) callback?.(id)`.

### `children` vs `content`

| Setup | Trigger | Fullscreen body | Typical use |
| ----- | ------- | --------------- | ----------- |
| `children` only | wrapped in a button | same `children` | Thumbnail zoom |
| `controlled` + `content` | `children` stays in place | `content` snippet | Button → upload progress, paywall |

### View transitions

- Shared name on source and target: inline `view-transition-name` on the thumbnail, or `takeoff(id, name, classes)` + `styles(name, classes)` on `content`.
- Add `view-transition-class: transition-spring transition-morph` and class `fullscreen-content` on the morphing element — matches built-in z-index (`::view-transition-group(.fullscreen-content)`).
- Content above the default stack? Add a scoped rule, e.g. `::view-transition-group(paywall) { z-index: 4; }`.
- List of items: unique name per row; set it only for the open item (see thumbnail example above).

### Overlay

- Set `x={false}` when `overlay` owns dismiss/delete.
- The built-in trigger hides `[data-slot=fullscreen-overlay]` descendants so overlay chrome does not appear in the thumbnail.
