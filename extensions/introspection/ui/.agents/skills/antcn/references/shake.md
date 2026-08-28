# Shake

## Notes

Use for obvious failures on small forms where error copy adds little value — e.g. a wrong password is already clear from context. Prefer a real error message when the user needs to know *what* went wrong.

## Usage

```svelte
<script lang="ts">
  import { Shake } from '$com/shake'

  let shake: { shake: () => Promise<void> } | undefined = $state()
</script>

<Shake bind:this={shake} class="w-full">
  <input type="password" />
</Shake>

<button onclick={() => shake?.shake()}>Retry</button>
```

## Props

| Prop       | Type         | Default | Notes                          |
| ---------- | ------------ | ------- | ------------------------------ |
| `children` | `Snippet`    | —       | Content that shakes.           |
| `class`    | `ClassValue` | —       | Classes on the wrapper `div`.  |

## Instance methods

Bind with `bind:this` to trigger the animation:

| Method     | Notes                                      |
| ---------- | ------------------------------------------ |
| `shake()`  | Plays the shake; resolves when it finishes. |
