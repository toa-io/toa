<script lang="ts">
  import { Badge } from '$ui/badge'
  import { dict } from './intl'
  import Schema from './Schema.svelte'
  import type { Props } from './Answer'

  const { of, class: className }: Props = $props()

  /** A reply that carried nothing says so by its status, and there is nothing to read. */
  const empty = $derived(of.body === '' || of.body === null || of.body === undefined)
</script>

<div class={['flex flex-col gap-2', className]}>
  <div class="flex items-center gap-2">
    <!-- what came back, which is the first thing about it worth knowing -->
    <Badge variant={of.ok ? 'secondary' : 'destructive'} class="font-mono text-[10px]">
      {of.status === 0 ? '—' : of.status}
    </Badge>

    <span class="text-muted-foreground text-xs">
      {of.ok ? $dict.call.answered : $dict.call.refused}
    </span>
  </div>

  {#if empty}
    <p class="text-muted-foreground text-xs">{$dict.call.empty}</p>
  {:else}
    <!-- read the way every schema on the page is, so one is compared with the other -->
    <Schema kind="value" label={$dict.call.body} value={of.body} open class="text-xs" />
  {/if}
</div>
