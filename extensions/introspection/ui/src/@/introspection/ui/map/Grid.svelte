<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity'
  import { Separator } from '$ui/separator'
  import { query } from '../ui'
  import { dict } from '../intl'
  import { press } from './press'
  import { measure } from './measure'
  import { BAND, CARD, DIMMED, grid } from './layout'
  import { found, label, neighbours, touching } from './graph'
  import { FLYER, MORPH, flying, open } from './flight'
  import Service from './Service.svelte'
  import Edges from './Edges.svelte'
  import Component from './Component.svelte'
  import type { Size } from './layout'
  import type { Vertex } from './graph'
  import type { Props } from './Grid'

  const { graph, view }: Props = $props()

  const sizes = new SvelteMap<string, Size>()

  let hovered = $state<string | null>(null)

  const laid = $derived(grid(graph, view))
  const positions = $derived(laid.positions)
  const related = $derived(neighbours(graph.links, hovered))

  /**
   * A line stands for every call between two cards, so it is only dashed where every
   * one of them was raised by an event; a pair that both calls and reacts keeps a plain
   * line, and the focused card is where the two are told apart.
   */
  const arcs = $derived(
    touching(graph.links, hovered).map((link) => ({
      id: link.id,
      from: link.from,
      to: link.to,
      dashed: link.events === link.calls,
    })),
  )

  function lit(vertex: Vertex): boolean {
    if (!found(vertex, $query)) return false

    return hovered === null || related.has(vertex.id)
  }
</script>

<Edges class="text-muted-foreground/50" {arcs} {positions} {sizes} />

<!-- what the application declared, then what the runtime gave it -->
{#each laid.bands as band (band.id)}
  <div
    class="text-muted-foreground absolute top-0 left-0 flex items-center gap-3"
    style:translate="{band.x}px {band.y}px"
    style:width="{band.width}px"
    style:height="{BAND.height}px"
  >
    <span class="text-xs font-medium tracking-wide uppercase">{$dict.space[band.label]}</span>
    <Separator class="flex-1" />
  </div>
{/each}

{#each graph.vertices as vertex (vertex.id)}
  {@const at = positions.get(vertex.id) ?? { x: 0, y: 0 }}

  <!-- the filter and the pointer both dim rather than hide: a connection to
       something out of focus is still a connection, and the map would lie
       without it -->
  <div
    class="absolute top-0 left-0 cursor-pointer transition-opacity"
    style:translate="{at.x}px {at.y}px"
    style:width="{CARD.width}px"
    style:opacity={lit(vertex) ? 1 : DIMMED}
    style:view-transition-name={$flying === vertex.id ? FLYER : undefined}
    style:view-transition-class={$flying === vertex.id ? MORPH : undefined}
    onmouseenter={() => (hovered = vertex.id)}
    onmouseleave={() => (hovered = null)}
    use:measure={{ into: sizes, id: vertex.id }}
    use:press={() => void open(vertex.id)}
    role="button"
    tabindex="0"
    aria-label={label(vertex)}
  >
    {#if vertex.kind === 'component'}
      <Component node={vertex.node} />
    {:else}
      <Service name={vertex.name} />
    {/if}
  </div>
{/each}
