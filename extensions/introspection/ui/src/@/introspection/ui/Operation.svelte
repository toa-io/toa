<script lang="ts">
  import { ChevronDown } from '@lucide/svelte'
  import * as Collapsible from '$ui/collapsible'
  import { Badge } from '$ui/badge'
  import { dict } from './intl'
  import Schema from './Schema.svelte'
  import type { Props } from './Operation'

  const { operation, row, class: className }: Props = $props()

  let open = $state(false)
</script>

<Collapsible.Root bind:open class={className}>
  <Collapsible.Trigger
    data-row={row}
    class="-mx-2 rounded-md px-2 py-1 transition-colors hover:bg-muted flex w-fit items-center gap-2 text-start"
  >
    <ChevronDown
      class={['text-muted-foreground size-3 shrink-0 transition-transform', open && 'rotate-180']}
    />
    <span class="font-medium">{operation.endpoint}</span>
    <Badge variant="outline" class="font-normal">{operation.type}</Badge>
    {#if operation.scope !== undefined}
      <span class="text-muted-foreground text-xs">{operation.scope}</span>
    {/if}
  </Collapsible.Trigger>

  <Collapsible.Content class="ms-4 mt-1 flex flex-col gap-1">
    <Schema label={$dict.node.input} value={operation.input} />
    <Schema label={$dict.node.output} value={operation.output} />
    <Schema label={$dict.node.errors} value={operation.errors} />
  </Collapsible.Content>
</Collapsible.Root>
