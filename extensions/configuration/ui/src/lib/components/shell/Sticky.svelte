<script lang="ts">
  import Underlay from './Underlay.svelte'
  import type { Props } from './Sticky'

  const { direction = 'bottom', children, class: classes }: Props = $props()
</script>

<div
  class={[
    'sticky flex justify-center py-2',
    direction === 'bottom' ? 'bottom-0' : 'top-0',
    classes,
  ]}
>
  <Underlay
    {direction}
    class={[
      'absolute inset-x-0 backdrop-blur-md -z-1',
      direction === 'bottom' ? 'bottom-0 -top-4' : 'top-0 -bottom-4',
    ]}
  />
  {@render children()}
</div>
