<script lang="ts">
  import { Fingerprint } from '@lucide/svelte'
  import { dict } from '@/iam/ui/intl'
  import { passkeys } from '@/iam'
  import { Spinner } from '$ui/spinner'
  import { Button } from '$ui/button'
  import type { AccountLike } from '../AccountLike'

  const { account }: { account: AccountLike } = $props()

  async function onclick(e: MouseEvent) {
    const button = e.currentTarget as HTMLButtonElement

    button.disabled = true

    await passkeys.login(account.id)

    button.disabled = false
  }
</script>

<Button
  class="w-full disabled:[&>.x-icon]:hidden [&>.x-spinner]:hidden disabled:[&>.x-spinner]:block"
  {onclick}
>
  <Fingerprint class="size-5 x-icon" />
  <Spinner class="x-spinner" />
  {$dict.auth.refresh.continue}
</Button>
