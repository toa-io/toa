<script lang="ts">
  import { Async } from 'svas'
  import { account } from '@/iam'
  import * as Item from '$ui/item'
  import { Transfer } from './transfer'
  import { providers } from './providers'
  import { Passkeys } from './passkeys'
  import Provider from './Provider.svelte'
  import type { Props } from './Credentials'

  const { class: classes }: Props = $props()
</script>

<Async store={account}>
  {#snippet awaited()}
    <div class={['flex flex-col gap-2', classes]}>
      <Item.Group class="gap-2">
        <Passkeys />
        {#each providers as provider (provider.id)}
          <Provider {provider} />
        {/each}
      </Item.Group>
      <Transfer class="self-start" />
    </div>
  {/snippet}
</Async>
