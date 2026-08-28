<script lang="ts">
  import { dict } from './intl'
  import Section from './Section.svelte'
  import Schema from './Schema.svelte'
  import Receiver from './Receiver.svelte'
  import Operation from './Operation.svelte'
  import Event from './Event.svelte'
  import type { Props } from './Details'

  const { node, class: className }: Props = $props()
</script>

<div class={['flex flex-col gap-4 text-sm', className]}>
  {#if node.entity !== null}
    <Section title={$dict.node.state}>
      <div class="text-muted-foreground flex flex-wrap gap-x-4">
        <span>{$dict.node.storage} {node.entity.storage ?? $dict.node.none}</span>
        {#if node.entity.associated}<span>{$dict.node.associated}</span>{/if}
      </div>

      <Schema label={$dict.node.schema} value={node.entity.schema} />
    </Section>
  {/if}

  {#if node.operations.length > 0}
    <Section title={$dict.node.operations(node.operations.length)}>
      {#each node.operations as operation (operation.endpoint)}
        <Operation {operation} />
      {/each}
    </Section>
  {/if}

  {#if node.events.length > 0}
    <Section title={$dict.node.events(node.events.length)}>
      {#each node.events as event (event.label)}
        <Event {event} />
      {/each}
    </Section>
  {/if}

  {#if node.receivers.length > 0}
    <Section title={$dict.node.receivers(node.receivers.length)}>
      {#each node.receivers as receiver (receiver.label)}
        <Receiver {receiver} />
      {/each}
    </Section>
  {/if}

  {#if node.extensions.length > 0}
    <Section title={$dict.node.extensions(node.extensions.length)}>
      {#each node.extensions as extension (extension)}
        <span class="text-muted-foreground">{extension}</span>
      {/each}
    </Section>
  {/if}

  <p class="text-muted-foreground text-xs">{$dict.node.version} {node.version}</p>
</div>
