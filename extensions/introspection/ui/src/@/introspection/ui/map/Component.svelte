<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import { DEFAULT } from '../ui'
  import { dict } from '../intl'
  import Summary from '../Summary.svelte'
  import Details from '../Details.svelte'
  import type { Props } from './Component'

  const { node, open = false, ontoggle, class: className }: Props = $props()
</script>

<Item.Root variant="outline" size="sm" class={['bg-card flex-col items-stretch gap-0', className]}>
  <div class="flex items-start gap-2">
    <Item.Content class="min-w-0">
      <Item.Title class="gap-0">
        {#if node.namespace !== DEFAULT}<span class="text-muted-foreground">{node.namespace}.</span
          >{/if}{node.component}
      </Item.Title>

      <Item.Description class="text-xs">
        <Summary {node} />
      </Item.Description>
    </Item.Content>

    {#if ontoggle !== undefined}
      <button
        type="button"
        aria-expanded={open}
        aria-label={$dict.map.expand}
        onclick={ontoggle}
        class="text-muted-foreground hover:bg-muted hover:text-foreground -m-1 shrink-0
          cursor-pointer rounded-md p-1 transition-colors"
      >
        <ChevronDown class={['size-4 transition-transform', open && 'rotate-180']} />
      </button>
    {/if}
  </div>

  {#if open}
    <Details {node} class="pt-3" />
  {/if}
</Item.Root>
