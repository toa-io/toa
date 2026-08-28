<script lang="ts">
  import { Radio } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import { SERVICE } from './layout'
  import type { Props } from './Service'

  const { name, class: className }: Props = $props()
</script>

<!-- a caller from outside the map: it has no manifest, only a name -->
<Item.Root
  variant="muted"
  size="sm"
  style="height: {SERVICE.height}px"
  class={['bg-muted items-center', className]}
>
  <Item.Media>
    <Radio class="text-muted-foreground size-4" />
  </Item.Media>

  <Item.Content>
    <Item.Title class="gap-0">{name}</Item.Title>
  </Item.Content>
</Item.Root>
