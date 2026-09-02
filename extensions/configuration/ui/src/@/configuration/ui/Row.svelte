<script lang="ts">
  import { ChevronRight, KeyRound } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import { base } from '$app/paths'
  import { DEFAULT, split } from './ui'
  import { holds } from './read'
  import { dict } from './intl'
  import type { Props } from './Row'

  const { configuration, class: className }: Props = $props()

  const name = $derived(split(configuration.component))
  const secret = $derived(holds(configuration.configuration))
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

          <!-- that the component keeps a secret is worth saying on the row; which one it
               is, and what it stands for, is the screen's business -->
          {#if secret}
            <KeyRound
              class="text-muted-foreground ms-1.5 size-3.5 shrink-0"
              aria-label={$dict.value.secret}
            />
          {/if}
        </Item.Title>
      </Item.Content>

      <ChevronRight class="size-4 shrink-0 opacity-60" />
    </a>
  {/snippet}
</Item.Root>
