<script lang="ts">
  import { Fingerprint } from '@lucide/svelte'
  import { Spinner } from '#ui/spinner/index.js'
  import { Button } from '#ui/button/index.js'
  import { dict } from '#/iam/ui/intl/index.js'
  import { passkeys } from '#/iam/index.js'

  let busy = $state(false)

  async function login() {
    busy = true

    await passkeys.login()

    busy = false
  }
</script>

<div class="flex flex-col items-center justify-center gap-2">
  <p>{$dict.auth.alreadyHaveAccount}</p>
  <Button id="iam-passkey-login-button" variant="secondary" onclick={login}>
    {#if busy}
      <Spinner />
    {:else}
      <Fingerprint />
    {/if}
    {$dict.auth.signin}
  </Button>
</div>
