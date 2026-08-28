<script lang="ts">
  import { FingerprintPattern } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import { Button } from '$ui/button'
  import { dict } from '../../intl'
  import type { Props } from './Summary'

  const { count, open, ontoggle }: Props = $props()

  const copy = $derived($dict.credentials.passkeys)
  const cta = $derived(open ? copy.collapse : count ? copy.manage : copy.create)
</script>

<Item.Root>
  <Item.Media variant="icon">
    <FingerprintPattern class="size-5" />
  </Item.Media>
  <Item.Content>
    <Item.Title>{copy.title}</Item.Title>
    <Item.Description>
      {#if count}{copy.count(count)}{:else}{copy.tagline}{/if}
    </Item.Description>
  </Item.Content>
  <Item.Actions>
    <Button variant="secondary" onclick={ontoggle}>{cta}</Button>
  </Item.Actions>
</Item.Root>
