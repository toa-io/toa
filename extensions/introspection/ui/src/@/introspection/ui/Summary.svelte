<script lang="ts">
  import { dict } from './intl'
  import type { Props } from './Summary'

  const { node, class: className }: Props = $props()

  const counts = $derived([
    { key: 'operations', phrase: $dict.node.operations(node.operations.length), of: node.operations },
    { key: 'events', phrase: $dict.node.events(node.events.length), of: node.events },
    { key: 'receivers', phrase: $dict.node.receivers(node.receivers.length), of: node.receivers },
  ])
</script>

<div class={['flex flex-wrap gap-x-3 gap-y-1', className]}>
  {#each counts as count (count.key)}
    <span class={[count.of.length === 0 && 'opacity-40']}>{count.phrase}</span>
  {/each}

  <span class={[node.entity === null && 'opacity-40']}>
    {node.entity === null ? $dict.node.stateless : $dict.node.state}
  </span>
</div>
