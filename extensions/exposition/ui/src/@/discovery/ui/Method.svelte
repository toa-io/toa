<script lang="ts">
  import { ChevronRight, SearchCheck } from '@lucide/svelte'
  import * as Tooltip from '$ui/tooltip'
  import * as Item from '$ui/item'
  import * as Collapsible from '$ui/collapsible'
  import { GUARDS, guard } from './ui'
  import { dict } from './intl'
  import Schema from './Schema.svelte'
  import Parameters from './Parameters.svelte'
  import Mcp from './Mcp.svelte'
  import Call from './Call.svelte'
  import type { Props } from './Method'

  let { route, verb, of, open = $bindable(false), class: className }: Props = $props()

  const guarded = $derived(guard(of))
  const Icon = $derived(GUARDS[guarded])

  /** Whether there is anything under it. A method that says nothing does not open. */
  const detailed = $derived(
    of.route !== undefined ||
      of.query !== undefined ||
      of.selection !== undefined ||
      of.octets !== undefined ||
      of.input !== undefined ||
      of.output !== undefined ||
      of.errors !== undefined,
  )
</script>

<Collapsible.Root bind:open class={className}>
  <Item.Root variant="muted" class="flex-col items-stretch gap-0 px-2.5 py-2">
    <!-- the verb, what it is, and what reaching it takes: in that order, and reading on
         from the title rather than pushed to the far end of the line. The verb is its own
         button — pressing it makes the call — so it sits beside what opens the method
         rather than inside it. -->
    <div class="flex w-full items-center gap-2">
      <Call {route} {verb} {of} />

      <Collapsible.Trigger
        disabled={!detailed}
        class="flex min-w-0 flex-1 items-center gap-3 text-start"
      >
        <Item.Content class="min-w-0">
          <Item.Title class="w-full gap-2">
          <!-- a method the route says nothing about has no line to leave blank: what it
               is, is what guards it, and that follows on directly -->
          {#if of.title !== undefined}
            <span class="min-w-0 truncate font-normal">{of.title}</span>
          {/if}

          <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
              <Tooltip.Trigger class="shrink-0">
                <Icon class="text-muted-foreground size-3.5" />
              </Tooltip.Trigger>

              <Tooltip.Content>{$dict.guard[guarded]}</Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>

          {#if of.selection?.search !== undefined}
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger class="shrink-0">
                  <SearchCheck class="text-muted-foreground size-3.5" />
                </Tooltip.Trigger>

                <Tooltip.Content>{$dict.resource.search}</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}

          {#if of.mcp === true}
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger class="shrink-0">
                  <Mcp class="text-muted-foreground size-3.5" />
                </Tooltip.Trigger>

                <Tooltip.Content>{$dict.resource.mcp}</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/if}
        </Item.Title>

        {#if of.description !== undefined}
          <Item.Description class="line-clamp-none">{of.description}</Item.Description>
        {/if}
      </Item.Content>

      <Item.Actions>
        {#if detailed}
          <ChevronRight
            class={[
              'text-muted-foreground size-4 shrink-0 transition-transform',
              open && 'rotate-90',
            ]}
          />
        {/if}
        </Item.Actions>
      </Collapsible.Trigger>
    </div>

    <Collapsible.Content>
      {#if open}
        <div class="flex flex-col gap-1 pt-3 text-xs">
          {#if of.route !== undefined}
            <Parameters label={$dict.resource.route} of={of.route} />
          {/if}

          {#if of.query !== undefined}
            <Parameters label={$dict.resource.query} of={of.query} />
          {/if}

          {#if of.selection !== undefined}
            <Parameters label={$dict.resource.selection} of={of.selection} />
          {/if}

          {#if of.octets !== undefined}
            <!-- the body is a file, which no schema states -->
            <div class="text-muted-foreground flex flex-wrap gap-x-2">
              <span>{$dict.call.file}</span>
              <span class="text-foreground font-mono">
                {of.octets.accept ?? $dict.call.anything}
              </span>
              <span class="opacity-60">·</span>
              <span class="text-foreground font-mono">{of.octets.limit}</span>
              {#if of.octets.stream === true}
                <span class="opacity-60">·</span>
                <span>{$dict.call.stream}</span>
              {/if}
            </div>
          {/if}

          {#if of.input !== undefined}
            <Schema label={$dict.resource.input} value={of.input} />
          {/if}

          {#if of.output !== undefined}
            <Schema label={$dict.resource.output} value={of.output} />
          {/if}

          {#if of.errors !== undefined}
            <Schema label={$dict.resource.errors} value={of.errors} />
          {/if}
        </div>
      {/if}
    </Collapsible.Content>
  </Item.Root>
</Collapsible.Root>
