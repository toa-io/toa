<script lang="ts">
  import { SvelteMap } from 'svelte/reactivity'
  import { Async, combined } from 'svas'
  import { edges, nodes } from '@/introspection'
  import { matches, query, rank } from '../ui'
  import { dict } from '../intl'
  import { viewport, zoomIdentity, type ZoomTransform } from './viewport'
  import { CARD, grid } from './layout'
  import { build, neighbours, touching } from './graph'
  import Service from './Service.svelte'
  import Edges from './Edges.svelte'
  import Component from './Component.svelte'
  import type { Size } from './layout'
  import type { Vertex } from './graph'
  import type { Props } from './Map'

  const { class: className }: Props = $props()

  const sizes = new SvelteMap<string, Size>()

  let transform = $state<ZoomTransform>(zoomIdentity)
  let hovered = $state<string | null>(null)
  const view = $state({ width: 0, height: 0 })

  /** What the filter and the pointer both fade a card down to — one rule, both causes. */
  const DIMMED = 0.25

  function found(vertex: Vertex): boolean {
    return vertex.kind === 'component' ? rank(vertex.node, $query) > 0 : matches(vertex.name, $query)
  }

  function lit(vertex: Vertex, related: Set<string>): boolean {
    if (!found(vertex)) return false

    return hovered === null || related.has(vertex.id)
  }

  // layout values, so an ancestor's scale does not change what is measured
  function measure(element: HTMLElement, id: string) {
    const observer = new ResizeObserver(() =>
      sizes.set(id, { width: element.offsetWidth, height: element.offsetHeight }),
    )

    observer.observe(element)

    return { destroy: () => observer.disconnect() }
  }
</script>

<div
  class={['bg-muted/30 relative touch-none overflow-hidden', className]}
  bind:clientWidth={view.width}
  bind:clientHeight={view.height}
  use:viewport={{ onchange: (next) => (transform = next) }}
>
  <Async store={combined(nodes, edges)}>
    {#snippet awaited([list, calls])}
      {@const graph = build(list, calls)}
      {@const positions = grid(graph, view)}
      {@const shown = touching(graph.links, hovered)}
      {@const related = neighbours(graph.links, hovered)}

      {#if graph.links.length === 0}
        <p class="text-muted-foreground absolute inset-x-0 top-4 text-center text-sm">
          {$dict.map.empty}
        </p>
      {/if}

      <div
        class="absolute top-0 left-0 origin-top-left"
        style:translate="{transform.x}px {transform.y}px"
        style:scale={transform.k}
      >
        <Edges class="text-muted-foreground/50" links={shown} {positions} {sizes} />

        {#each graph.vertices as vertex (vertex.id)}
          {@const at = positions.get(vertex.id) ?? { x: 0, y: 0 }}

          <!-- the filter and the pointer both dim rather than hide: a connection to
               something out of focus is still a connection, and the map would lie
               without it -->
          <div
            class="absolute top-0 left-0 transition-opacity"
            style:translate="{at.x}px {at.y}px"
            style:width="{CARD.width}px"
            style:opacity={lit(vertex, related) ? 1 : DIMMED}
            onmouseenter={() => (hovered = vertex.id)}
            onmouseleave={() => (hovered = null)}
            use:measure={vertex.id}
            role="presentation"
          >
            {#if vertex.kind === 'component'}
              <Component node={vertex.node} />
            {:else}
              <Service name={vertex.name} />
            {/if}
          </div>
        {/each}
      </div>
    {/snippet}
  </Async>
</div>
