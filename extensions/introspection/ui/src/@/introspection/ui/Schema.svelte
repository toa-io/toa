<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Collapsible from '$ui/collapsible'
  import { dict } from './intl'
  import type { Props } from './Schema'

  const { label, value, class: className }: Props = $props()

  let open = $state(false)

  const empty = $derived(
    value === null ||
      value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0),
  )
</script>

{#if empty}
  <div class={['text-muted-foreground flex gap-2', className]}>
    {label}
    <span class="opacity-60">{$dict.node.none}</span>
  </div>
{:else}
  <Collapsible.Root bind:open class={className}>
    <Collapsible.Trigger class="text-muted-foreground hover:text-foreground flex items-center gap-1">
      <ChevronDown class={['size-3 transition-transform', open && 'rotate-180']} />
      {label}
    </Collapsible.Trigger>

    <Collapsible.Content>
      <pre data-scrollable class="bg-muted/50 mt-1 max-h-80 overflow-auto rounded-md p-2 text-xs">{JSON.stringify(
        value,
        null,
        2,
      )}</pre>
    </Collapsible.Content>
  </Collapsible.Root>
{/if}
