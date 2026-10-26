<script lang="ts">
  import { dict } from '#/iam/ui/intl/index.js'
  import Button from './Button.svelte'
  import type { oidc } from '#/iam/index.js'

  const { idp }: { idp: oidc.IDP } = $props()

  const names: Record<oidc.IDP, string> = {
    google: 'Google',
    apple: 'Apple',
  }
</script>

<Button {idp} class="w-full">
  {$dict.auth.continueWith(names[idp])}
</Button>
