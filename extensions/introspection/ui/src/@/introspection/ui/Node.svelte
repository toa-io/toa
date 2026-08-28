<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import * as Collapsible from '$ui/collapsible'
  import { DEFAULT } from './ui'
  import Summary from './Summary.svelte'
  import Details from './Details.svelte'
  import type { Props } from './Node'

  const { node, class: className }: Props = $props()

  let open = $state(false)
</script>

<Collapsible.Root bind:open class={className}>
  <Item.Root variant="outline" class="flex-col items-stretch gap-0">
    <Collapsible.Trigger class="flex w-full items-start gap-2 text-start">
      <Item.Content>
        <!-- the name is one string; the component spaces its children by default -->
        <Item.Title class="gap-0">
          {#if node.namespace !== DEFAULT}<span class="text-muted-foreground"
              >{node.namespace}.</span
            >{/if}{node.component}
        </Item.Title>

        <Item.Description>
          <Summary {node} />
        </Item.Description>
      </Item.Content>

      <ChevronDown
        class={[
          'text-muted-foreground mt-1 size-4 shrink-0 transition-transform',
          open && 'rotate-180',
        ]}
      />
    </Collapsible.Trigger>

    <Collapsible.Content>
      <Details {node} class="pt-4" />
    </Collapsible.Content>
  </Item.Root>
</Collapsible.Root>
