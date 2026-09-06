<script lang="ts">
  import * as Item from '$ui/item'
  import { Button } from '$ui/button'
  import { dict } from '../intl'
  import type { Props } from './Provider'

  const { provider }: Props = $props()

  const Icon = $derived(provider.icon)
  const copy = $derived($dict.credentials[provider.id])
</script>

<Item.Root variant="outline">
  <Item.Media variant="icon">
    <Icon class="size-5" />
  </Item.Media>
  <Item.Content>
    <Item.Title>{copy.title}</Item.Title>
    <Item.Description>{copy.description}</Item.Description>
  </Item.Content>
  <Item.Actions>
    <Button variant="secondary">{$dict.credentials.connect}</Button>
  </Item.Actions>
</Item.Root>
