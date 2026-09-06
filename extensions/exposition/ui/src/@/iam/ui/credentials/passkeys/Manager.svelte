<script lang="ts">
  import { add } from '@/passkeys'
  import { account } from '@/iam'
  import { Spinner } from '$ui/spinner'
  import * as Item from '$ui/item'
  import { Input } from '$ui/input'
  import { Button } from '$ui/button'
  import { onsubmit } from '$lib/tools'
  import { dict } from '../../intl'
  import Key from './Key.svelte'
  import type { Props } from './Manager'

  const { keys }: Props = $props()

  const id = $derived($account?.id)

  let input = $state<HTMLInputElement | null>(null)
  let value = $state('')
  let busy = $state(false)
  let error = $state<Error | null>(null)

  // WebAuthn raises InvalidStateError only when the authenticator already holds
  // a credential the challenge excluded — this device is enrolled already
  const message = $derived(
    error === null
      ? null
      : error.name === 'InvalidStateError'
        ? $dict.credentials.passkeys.duplicate
        : $dict.credentials.passkeys.failed,
  )

  export function focus() {
    input?.focus()
  }

  async function submit() {
    const name = value.trim()

    if (id === undefined || name.length === 0) return

    busy = true
    error = null

    const res = await add(id, name)

    busy = false

    if (res instanceof Error) error = res
    else value = ''
  }
</script>

{#each keys as key (key.id)}
  <Item.Separator />
  <Key passkey={key} />
{/each}

<Item.Separator />

<form onsubmit={onsubmit(submit)} class="flex flex-col gap-2 p-2 pt-0">
  <div class="flex items-center gap-2">
    <Input
      bind:ref={input}
      bind:value
      name="name"
      type="text"
      autocomplete="given-name"
      placeholder={$dict.credentials.passkeys.add}
      aria-invalid={message !== null}
      required
      disabled={busy} />
    <Button variant="outline" type="submit" disabled={busy}>
      {#if busy}
        <Spinner />
      {:else}
        {$dict.credentials.passkeys.create}
      {/if}
    </Button>
  </div>
  {#if message !== null}
    <p role="alert" class="text-destructive px-1 text-sm">{message}</p>
  {/if}
</form>
