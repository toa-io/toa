<script lang="ts">
  import { ArrowRight } from '@lucide/svelte'
  import { Badge } from '$ui/badge'
  import { shorten } from './ui'
  import { dict } from './intl'
  import type { Props } from './Receiver'

  const { receiver, row, class: className }: Props = $props()
</script>

<div data-row={row} class={['-mx-2 rounded-md px-2 py-1 transition-colors hover:bg-muted flex w-fit flex-wrap items-center gap-2', className]}>
  <span class="text-muted-foreground">{shorten(receiver.source)}.{receiver.event}</span>
  <ArrowRight class="text-muted-foreground size-3 shrink-0" />
  <span class="font-medium">{receiver.operation}</span>

  {#if receiver.conditioned}
    <Badge variant="outline" class="font-normal">{$dict.node.conditioned}</Badge>
  {/if}

  {#if receiver.adaptive}
    <Badge variant="outline" class="font-normal">{$dict.node.adaptive}</Badge>
  {/if}
</div>
