<script lang="ts">
  import { ChevronRight } from '@lucide/svelte'
  import * as Item from '$ui/item'
  import * as Collapsible from '$ui/collapsible'
  import { Badge } from '$ui/badge'
  import { method, slashed, verbs } from './ui'
  import { dict } from './intl'
  import Parameters from './Parameters.svelte'
  import Method from './Method.svelte'
  import type { Props } from './Resource'

  let { route, resource, open = $bindable(false), class: className }: Props = $props()

  const served = $derived(verbs(resource))
  const named = $derived(resource.title ?? null)

  /** What every method of it takes in the path, which is the resource's rather than one method's. */
  const parameters = $derived(
    served
      .map((verb) => method(resource, verb).route)
      .find((route) => route !== undefined) ?? null,
  )
</script>

<Collapsible.Root bind:open class={className}>
  <Item.Root variant="outline" class="flex-col items-stretch gap-0">
    <Collapsible.Trigger class="flex w-full items-center gap-3 text-start">
      <Item.Content class="min-w-0">
        <!-- the title takes the line, and what it serves is pushed to the end of it -->
        <Item.Title class="w-full gap-2">
          <span class={['min-w-0 truncate', named === null && 'font-mono font-normal']}>
            {named ?? slashed(route)}
          </span>

          <span class="ms-auto flex shrink-0 gap-1">
            {#each served as verb (verb)}
              <Badge variant="secondary" class="font-mono text-[10px]">{verb}</Badge>
            {/each}
          </span>
        </Item.Title>

        <!-- the path, under the name it was given; unnamed, the title is the path already -->
        {#if named !== null}
          <Item.Description class="line-clamp-none font-mono">
            {slashed(route)}
          </Item.Description>
        {/if}
      </Item.Content>

      <Item.Actions>
        <ChevronRight
          aria-label={$dict.resource.expand}
          class={[
            'text-muted-foreground size-4 shrink-0 transition-transform',
            open && 'rotate-90',
          ]}
        />
      </Item.Actions>
    </Collapsible.Trigger>

    <Collapsible.Content>
      {#if open}
        <div class="flex flex-col gap-3 pt-4">
          {#if resource.description !== undefined}
            <p class="text-muted-foreground text-sm">{resource.description}</p>
          {/if}

          {#if parameters !== null}
            <Parameters label={$dict.resource.route} of={parameters} />
          {/if}

          <Item.Group class="gap-2">
            {#each served as verb (verb)}
              <Method {route} {verb} of={method(resource, verb)} />
            {/each}
          </Item.Group>
        </div>
      {/if}
    </Collapsible.Content>
  </Item.Root>
</Collapsible.Root>
