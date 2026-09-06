<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte'
  import { faded } from './store'
  import { back } from './history'
  import Button from './Button.svelte'
  import type { Props } from './Back'

  const { ret, section }: Props = $props()
  const id = $derived(section ? `nav-${section.id}-button` : undefined)
</script>

<div>
  <Button {id} active faded={$faded} onclick={() => back(ret.href)} class={ret.class}>
    {#if ret.children}
      {@render ret.children()}
    {:else}
      <ChevronLeft />
    {/if}
  </Button>
</div>
