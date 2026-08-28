<script lang="ts">
  import { FingerprintPattern, KeyRound, Trash2 } from '@lucide/svelte'
  import { remove } from '@/passkeys'
  import * as Item from '$ui/item'
  import { date } from '$lib/tools'
  import { Hold } from '$com/hold'
  import { dict, locale } from '../../intl'
  import { resolve, type Props } from './Key'

  const { passkey }: Props = $props()

  const copy = $derived($dict.credentials.passkeys)
  const auth = $derived(resolve(passkey.aid))
  const meta = $derived(copy.meta(date(passkey._created, $locale), date(passkey._updated, $locale)))
</script>

<Item.Root>
  <Item.Media variant="icon">
    {#if auth?.light || auth?.dark}
      <img src={auth.light} alt="" class="size-5 dark:hidden" />
      <img src={auth.dark} alt="" class="hidden size-5 dark:block" />
    {:else if auth}
      <FingerprintPattern class="size-5" />
    {:else}
      <KeyRound class="size-5" />
    {/if}
  </Item.Media>
  <Item.Content>
    <Item.Title>{passkey.label || auth?.name || copy.unknown}</Item.Title>
    <Item.Description>{meta}</Item.Description>
  </Item.Content>
  <Item.Actions>
    <Hold
      name={`delete-passkey-${passkey.id}`}
      variant="destructive"
      size="icon"
      label={copy.delete}
      onclick={() => remove(passkey.id)}>
      <Trash2 />
    </Hold>
  </Item.Actions>
</Item.Root>
