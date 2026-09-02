<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import { configuration } from '$config'
  import { identify } from './ui'
  import { dict } from './intl'
  import Section from './Section.svelte'
  import Schema from './Schema.svelte'
  import Receiver from './Receiver.svelte'
  import Operation from './Operation.svelte'
  import Event from './Event.svelte'
  import { CONFIGURATION, type Props } from './Details'

  const { node, class: className }: Props = $props()
</script>

<div class={['flex flex-col gap-4 text-sm', className]}>
  {#if node.entity !== null}
    <Section title={$dict.node.state} class="gap-1">
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
        <Operation {operation} row="operation:{operation.endpoint}" />
      {/each}
    </Section>
  {/if}

  {#if node.events.length > 0}
    <Section title={$dict.node.events(node.events.length)}>
      {#each node.events as event (event.label)}
        <Event {event} row="event:{event.label}" />
      {/each}
    </Section>
  {/if}

  {#if node.receivers.length > 0}
    <Section title={$dict.node.receivers(node.receivers.length)}>
      {#each node.receivers as receiver (receiver.label)}
        <Receiver {receiver} row="receiver:{receiver.label}" />
      {/each}
    </Section>
  {/if}

  {#if node.extensions.length > 0}
    <Section title={$dict.node.extensions(node.extensions.length)} class="gap-1" collapsible>
      {#each node.extensions as extension (extension)}
        {#if extension === CONFIGURATION}
          <!-- the one extension with a page of its own: what a component is configured
               with is read next door, not here -->
          <a
            id="node-configuration-link"
            href={configuration(identify(node))}
            class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1
              transition-colors"
          >
            {extension}
            <ChevronRight class="size-3.5 shrink-0 opacity-60" />
          </a>
        {:else}
          <span class="text-muted-foreground">{extension}</span>
        {/if}
      {/each}
    </Section>
  {/if}

  <p class="text-muted-foreground text-xs">{$dict.node.version} {node.version}</p>
</div>
