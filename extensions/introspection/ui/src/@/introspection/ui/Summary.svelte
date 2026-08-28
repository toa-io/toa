<script lang="ts">
  import { Circle, CircleDashed, Database, Zap } from '@lucide/svelte'
  import { dict } from './intl'
  import type { Props } from './Summary'

  const { node, class: className }: Props = $props()

  const counts = $derived([
    { key: 'operations', Icon: Circle, of: node.operations, label: $dict.node.operations },
    { key: 'events', Icon: Zap, of: node.events, label: $dict.node.events },
    { key: 'receivers', Icon: CircleDashed, of: node.receivers, label: $dict.node.receivers },
  ])
</script>

<!-- the words are the label rather than the text: what a card is asked at a glance is how
     much of each a component has, and three numbers say it in the room a phrase wanted -->
<div class={['flex flex-wrap items-center gap-x-3 gap-y-1', className]}>
  {#each counts as count (count.key)}
    <span
      class={['inline-flex items-center gap-1', count.of.length === 0 && 'opacity-40']}
      aria-label={count.label(count.of.length)}
    >
      <count.Icon class="size-3.5" aria-hidden="true" />
      {count.of.length}
    </span>
  {/each}

  {#if node.entity !== null}
    <Database class="size-3.5" aria-label={$dict.node.state} />
  {/if}
</div>
