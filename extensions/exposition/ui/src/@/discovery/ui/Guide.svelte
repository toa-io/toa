<script lang="ts">
  import { ChevronRight, CircleQuestionMark } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import type { Props } from './Guide'

  const { href, title, id }: Props = $props()
</script>

<Item.Root variant="outline">
  {#snippet child({ props })}
    <a {...props} {id} {href}>
      <Item.Media variant="icon">
        <CircleQuestionMark />
      </Item.Media>

      <Item.Content class="min-w-0">
        <Item.Title class="w-full">{title}</Item.Title>
      </Item.Content>

      <Item.Actions>
        <ChevronRight class="text-muted-foreground size-4 shrink-0" />
      </Item.Actions>
    </a>
  {/snippet}
</Item.Root>
