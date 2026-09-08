<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import { Async } from 'svas'
  import { tree } from '@/discovery'
  import { Separator } from '$ui/separator'
  import * as Item from '$ui/item'
  import { discovered, only, query, rank, system } from './ui'
  import { dict } from './intl'
  import Resource from './Resource.svelte'
  import type { Resource as Described } from '@/discovery'
  import type { Props } from './Resources'

  const { class: className, ...props }: Props = $props()

  /** Which cards are open. Held here so the filter can open the one it has left. */
  const opened = new SvelteSet<string>()

  const of = $derived(discovered($tree))
  const routes = $derived(of === null ? [] : Object.entries(of.routes))

  const shown = $derived(
    routes
      .map(([route, resource]) => ({ route, resource, rank: rank(route, resource, $query) }))
      .filter((ranked) => ranked.rank > 0)
      .sort(order),
  )

  // pressing a card opens it, so that is what the key does when only one is left
  $effect(() => {
    const single = shown.length === 1 ? shown[0].route : null

    only.set(single === null ? null : () => opened.add(single))

    return () => only.set(null)
  })

  /** Best answers first; the tree itself is already in the order a reader wants. */
  function order(a: Ranked, b: Ranked) {
    return b.rank - a.rank || a.route.localeCompare(b.route)
  }

  /**
   * What the application serves, then what it runs on. A group the filter has emptied is
   * not a group: its heading would say there is something there and there is not.
   */
  function group(ranked: Ranked[]) {
    return [
      { id: 'user', label: $dict.space.user, of: ranked.filter((it) => !system(it.route)) },
      { id: 'system', label: $dict.space.system, of: ranked.filter((it) => system(it.route)) },
    ].filter((band) => band.of.length > 0)
  }

  interface Ranked {
    route: string
    resource: Described
    rank: number
  }
</script>

<Async store={tree}>
  {#snippet awaited()}
    {#if shown.length > 0}
      <div class={['flex flex-col gap-6', className]} {...props}>
        {#each group(shown) as band (band.id)}
          <section class="flex flex-col gap-2">
            <div class="text-muted-foreground flex items-center gap-3">
              <span class="text-xs font-medium tracking-wide uppercase">{band.label}</span>
              <Separator class="flex-1" />
            </div>

            <Item.Group class="gap-2">
              {#each band.of as ranked (ranked.route)}
                <Resource
                  route={ranked.route}
                  resource={ranked.resource}
                  bind:open={() => opened.has(ranked.route),
                  (open) => (open ? opened.add(ranked.route) : opened.delete(ranked.route))}
                />
              {/each}
            </Item.Group>
          </section>
        {/each}
      </div>
    {:else if routes.length > 0}
      <p class="text-muted-foreground py-20 text-center">{$dict.resources.nomatch}</p>
    {/if}
  {/snippet}
</Async>
