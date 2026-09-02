<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import { base } from '$app/paths'
  import { DEFAULT, split } from './ui'
  import type { Props } from './Row'

  const { configuration, class: className }: Props = $props()

  const name = $derived(split(configuration.component))
</script>

<!-- the row is the link, which is what the item's own `[a]:hover` styling expects -->
<Item.Root variant="outline" size="sm" class={className}>
  {#snippet child({ props })}
    <a {...props} id="configurations-{configuration.id}-link" href="{base}/{configuration.id}/">
      <Item.Content class="min-w-0">
        <!-- the name is one string; the component spaces its children by default, and a
             name too long for its column ends in an ellipsis rather than wrapping -->
        <Item.Title class="w-full min-w-0 gap-0" title={configuration.component}>
          <span class="truncate">
            {#if name.namespace !== DEFAULT}<span class="text-muted-foreground"
                >{name.namespace}.</span
              >{/if}{name.component}
          </span>
        </Item.Title>
      </Item.Content>

      <ChevronRight class="size-4 shrink-0 opacity-60" />
    </a>
  {/snippet}
</Item.Root>
