<script lang="ts">
  import { ArrowRight } from '@lucide/svelte'
  import { dict } from '@/iam/ui/intl'
  import { passkeys } from '@/iam'
  import { Spinner } from '$ui/spinner'
  import { Input } from '$ui/input'
  import { Button } from '$ui/button'
  import { autofocus, onsubmit } from '$lib/tools'
  import type { Props } from './Create'

  const { account, disabled, oncreate }: Props = $props()

  let value = $derived(account?.name ?? '')
  let busy = $state(false)

  async function submit() {
    const name = value.trim()

    if (name.length === 0) return

    busy = true

    const echo = await passkeys.create(name, account?.id)

    busy = false

    if (echo instanceof Error) return

    oncreate?.(echo)
  }
</script>

<form onsubmit={onsubmit(submit)}>
  <fieldset class="space-y-1" {disabled}>
    <div class="flex items-center gap-2">
      <Input
        bind:value
        id="name"
        type="text"
        placeholder={$dict.auth.yourName}
        autocomplete="given-name"
        required
        {autofocus} />
      <Button id="iam-passkey-create-button" size="icon-lg" type="submit">
        {#if busy}
          <Spinner />
        {:else}
          <ArrowRight />
        {/if}
      </Button>
    </div>
  </fieldset>
</form>
