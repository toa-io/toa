<script lang="ts">
  import * as Item from '$ui/item'
  import { DEFAULT } from '../ui'
  import Summary from '../Summary.svelte'
  import type { Props } from './Component'

  const { node, class: className }: Props = $props()
</script>

<Item.Root variant="outline" size="sm" class={['bg-card flex-col items-stretch gap-0', className]}>
  <Item.Title class="gap-0">
    {#if node.namespace !== DEFAULT}<span class="text-muted-foreground">{node.namespace}.</span
      >{/if}{node.component}
  </Item.Title>

  <Item.Description class="text-xs">
    <Summary {node} />
  </Item.Description>
</Item.Root>
