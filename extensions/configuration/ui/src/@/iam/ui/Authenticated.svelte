<script lang="ts">
  import { authenticated, greeting, account as iam, method, processing } from '@/iam'
  import { Spinner } from '$ui/spinner'
  import { cn } from '$lib/utils'
  import { browser } from '$app/environment'
  import Refresh from './Refresh.svelte'
  import Authentication from './Authentication.svelte'
  import type { Props } from './Authenticated'

  const { children, screen, account, oncreate }: Props = $props()
</script>

{#snippet authentication()}
  {#if $iam}
    <Refresh account={$iam} method={$method} />
  {:else}
    <Authentication
      class={cn('scale-0 transition-transform', browser && 'scale-100')}
      {account}
      {oncreate}
    />
  {/if}
{/snippet}

{#if browser && $authenticated}
  {@render children()}
{:else if $greeting || $processing || !browser}
  <div class="flex items-center justify-center h-screen">
    <Spinner />
  </div>
{:else if screen}
  {@render screen({ authentication })}
{:else}
  <div class="flex w-full max-w-sm items-center justify-center pt-[14vh] px-4 mx-auto">
    {@render authentication()}
  </div>
{/if}
