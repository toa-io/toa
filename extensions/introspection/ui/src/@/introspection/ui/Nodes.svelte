<script lang="ts">
  import { Async } from 'svas'
  import { nodes } from '@/introspection'
  import { Separator } from '$ui/separator'
  import * as Item from '$ui/item'
  import { query, rank, system } from './ui'
  import { dict } from './intl'
  import Node from './Node.svelte'
  import type { Props } from './Nodes'
  import type { NodeLike } from './Node'

  const { class: className, ...props }: Props = $props()

  /** Best answers first; the map arrives in whatever order the database returns it. */
  function order(a: Ranked, b: Ranked) {
    return (
      b.rank - a.rank ||
      a.node.namespace.localeCompare(b.node.namespace) ||
      a.node.component.localeCompare(b.node.component)
    )
  }

  /**
   * What the application declared, then what it was given. A group the filter has emptied
   * is not a group: its heading would say there is something there and there is not.
   */
  function group(ranked: Ranked[]) {
    return [
      { id: 'user', label: $dict.space.user, of: ranked.filter((it) => !system(it.node)) },
      { id: 'system', label: $dict.space.system, of: ranked.filter((it) => system(it.node)) },
    ].filter((group) => group.of.length > 0)
  }

  interface Ranked {
    node: NodeLike & { id: string }
    rank: number
  }
</script>

<Async store={nodes}>
  {#snippet awaited(list)}
    {@const shown = list
      .map((node) => ({ node, rank: rank(node, $query) }))
      .filter((ranked) => ranked.rank > 0)
      .sort(order)}

    {#if list.length === 0}
      <p class="text-muted-foreground py-20 text-center">{$dict.nodes.empty}</p>
    {:else if shown.length === 0}
      <p class="text-muted-foreground py-20 text-center">{$dict.nodes.nomatch}</p>
    {:else}
      <div class={['flex flex-col gap-6', className]} {...props}>
        {#each group(shown) as band (band.id)}
          <section class="flex flex-col gap-2">
            <div class="text-muted-foreground flex items-center gap-3">
              <span class="text-xs font-medium tracking-wide uppercase">{band.label}</span>
              <Separator class="flex-1" />
            </div>

            <Item.Group class="gap-2">
              {#each band.of as ranked (ranked.node.id)}
                <Node node={ranked.node} />
              {/each}
            </Item.Group>
          </section>
        {/each}
      </div>
    {/if}
  {/snippet}
</Async>
