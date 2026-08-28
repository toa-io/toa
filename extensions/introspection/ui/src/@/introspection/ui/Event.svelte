<script lang="ts">
  import type { Props } from './Event'

  const { event, class: className }: Props = $props()
</script>

<div class={['flex flex-wrap items-baseline gap-2', className]}>
  <span class="font-medium">{event.label}</span>

  {#if event.binding !== undefined}
    <span class="text-muted-foreground text-xs">{event.binding}</span>
  {/if}
</div>
