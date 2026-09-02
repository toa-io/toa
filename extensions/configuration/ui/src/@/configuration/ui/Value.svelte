<script lang="ts">
  import { KeyRound } from '@lucide/svelte'
  import { read, ITEM } from './read'
  import { dict } from './intl'
  import type { Props } from './Value'

  const { value, class: className }: Props = $props()

  const lines = $derived(read(value))
</script>

<!-- the value as it is held, not as a form would take it: a secret is a reference, and a
     reference is all there is to show -->
<div
  data-scrollable
  class={[
    'bg-muted/50 overflow-auto rounded-md p-3 font-mono text-xs whitespace-nowrap',
    className,
  ]}
>
  {#each lines as line, at (at)}
    <div style:padding-inline-start="{line.depth}rem">
      {#if line.key === ITEM}<span class="text-muted-foreground">-</span>{:else}{line.key}<span
          class="text-muted-foreground">:</span
        >{/if}{#if line.secret}
        <span class="text-muted-foreground inline-flex items-center gap-1 align-middle">
          <KeyRound class="size-3" aria-hidden="true" />
          {$dict.value.secret}
        </span>
      {:else if line.value !== null}&nbsp;{line.value}{/if}
    </div>
  {/each}
</div>
