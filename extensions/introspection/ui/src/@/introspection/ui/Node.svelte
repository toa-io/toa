<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import * as Collapsible from '$ui/collapsible'
  import { DEFAULT } from './ui'
  import Summary from './Summary.svelte'
  import Details from './Details.svelte'
  import type { Props } from './Node'

  let { node, open = $bindable(false), collapsible = true, class: className }: Props = $props()
</script>

{#snippet summary()}
  <Item.Content>
    <!-- the name is one string; the component spaces its children by default -->
    <Item.Title class="gap-0">
      {#if node.namespace !== DEFAULT}<span class="text-muted-foreground"
          >{node.namespace}.</span
        >{/if}{node.component}
    </Item.Title>

    <!-- see the map card: a clamp meant for prose has no row of counts to shorten -->
    <Item.Description class="line-clamp-none">
      <Summary {node} />
    </Item.Description>
  </Item.Content>
{/snippet}

{#if collapsible}
  <Collapsible.Root bind:open class={className}>
    <Item.Root variant="outline" class="flex-col items-stretch gap-0">
      <Collapsible.Trigger class="flex w-full items-start gap-2 text-start">
        {@render summary()}

        <ChevronDown
          class={[
            'text-muted-foreground mt-1 size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          ]}
        />
      </Collapsible.Trigger>

      <Collapsible.Content>
        {#if open}
          <Details {node} class="pt-4" />
        {/if}
      </Collapsible.Content>
    </Item.Root>
  </Collapsible.Root>
{:else}
  <Item.Root variant="outline" class={['flex-col items-stretch gap-0', className]}>
    {@render summary()}

    <Details {node} class="pt-4" />
  </Item.Root>
{/if}
