<script lang="ts">
  import { oidc } from '@/iam'
  import Button from './Button.svelte'
  import type { Props } from './Authentication'

  const { account }: Props = $props()
</script>

<div class="flex gap-2">
  {#if oidc.providers.google.client}
    <Button idp="google" {account} />
  {/if}
  {#if oidc.providers.apple.client}
    <Button idp="apple" {account} />
  {/if}
</div>
