<script lang="ts">
  import type { Props } from './Event'

  const { event, row, class: className }: Props = $props()
</script>

<div data-row={row} class={['-mx-2 rounded-md px-2 py-1 transition-colors hover:bg-muted flex w-fit flex-wrap items-baseline gap-2', className]}>
  <span class="font-medium">{event.label}</span>

  {#if event.binding !== undefined}
    <span class="text-muted-foreground text-xs">{event.binding}</span>
  {/if}
</div>
