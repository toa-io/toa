<script lang="ts">
  import { Braces, ChevronDown } from '@lucide/svelte'
  import * as Collapsible from '$ui/collapsible'
  import { Clipboard } from '$lib/components/clipboard'
  import { read } from './shape'
  import { dict } from './intl'
  import type { Props } from './Schema'

  const { label, value, class: className }: Props = $props()

  let open = $state(false)

  const empty = $derived(
    value === null ||
      value === undefined ||
      (typeof value === 'object' && Object.keys(value).length === 0),
  )

  /** A schema is an object; a plain list is the one other thing the map carries here. */
  const listed = $derived(Array.isArray(value) ? (value as unknown[]) : null)
</script>

{#if empty}
  <div class={['text-muted-foreground flex gap-2', className]}>
    {label}
    <span class="opacity-60">{$dict.node.unset}</span>
  </div>
{:else}
  <Collapsible.Root bind:open class={className}>
    <Collapsible.Trigger class="text-muted-foreground hover:text-foreground flex items-center gap-1">
      <ChevronDown class={['size-3 transition-transform', open && 'rotate-180']} />
      {label}
    </Collapsible.Trigger>

    <Collapsible.Content>
      <div class="relative mt-1">
        <div
          data-scrollable
          class="bg-muted/50 max-h-80 overflow-auto rounded-md p-2 font-mono text-xs whitespace-nowrap"
          class:pe-9={listed === null}
        >
          {#if listed !== null}
            {#each listed as item, at (at)}
              <div><span class="text-muted-foreground">-</span> {String(item)}</div>
            {/each}
          {:else}
            <!-- the shape, not the schema: what a value is, with nothing about how it
                 is checked. What is optional says so by saying it more quietly. -->
            {#each read(value) as line, at (at)}
              <div
                style:padding-inline-start="{line.depth}rem"
                class={[line.optional && 'text-muted-foreground']}
              >
                {#if line.key !== null}{line.key}:{/if}{#if line.type !== null}{line.key === null
                  ? ''
                  : ' '}{line.type}{/if}
              </div>
            {/each}
          {/if}
        </div>

        {#if listed === null}
          <Clipboard
            text={JSON.stringify(value, null, 2)}
            variant="ghost"
            size="icon-xs"
            aria-label={$dict.node.copy}
            class="text-muted-foreground absolute end-1 top-1"
          >
            {#snippet icon()}
              <Braces />
            {/snippet}
          </Clipboard>
        {/if}
      </div>
    </Collapsible.Content>
  </Collapsible.Root>
{/if}
