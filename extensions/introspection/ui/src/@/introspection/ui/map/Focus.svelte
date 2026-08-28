<script lang="ts">
  import { SvelteMap, SvelteSet } from 'svelte/reactivity'
  import { query } from '../ui'
  import Node from '../Node.svelte'
  import { rows } from './rows'
  import { press } from './press'
  import { measure } from './measure'
  import { arrange, CARD, DIMMED, FOCUSED, STUB } from './layout'
  import { hover } from './hover'
  import { focus, found, label } from './graph'
  import Service from './Service.svelte'
  import Edges from './Edges.svelte'
  import Component from './Component.svelte'
  import type { Row } from './rows'
  import type { Position, Size } from './layout'
  import type { Satellite, Wire } from './graph'
  import type { Props } from './Focus'
  import type { Anchor, Arc } from './Edges'

  const { graph, id, view, onselect }: Props = $props()

  const sizes = new SvelteMap<string, Size>()
  const lines = new SvelteMap<string, Row>()

  /**
   * The one neighbour showing its rows. One at a time: two opened cards is two columns
   * of rows and a screen of lines between them, which is the tangle this is meant to
   * undo rather than restage.
   */
  let opened = $state<string | null>(null)

  /**
   * What the pointer is asking about: a card, and then its own lines are the answer, or
   * a row of the focused card, and then so is everything that row talks to.
   */
  let asked = $state<{ of: 'card' | 'row'; id: string } | null>(null)

  const spot = $derived(focus(graph, id))

  /**
   * A service calls whatever the application exposes, which here is most of the card:
   * its lines cross everything and say only that the component is reachable from
   * outside. It opens silenced, and a held shift brings it back.
   */
  function hushed(): string[] {
    return (spot?.incoming ?? [])
      .filter((satellite) => satellite.vertex.kind === 'service')
      .map((satellite) => satellite.id)
  }

  /**
   * Cards the reader has silenced with a held shift. A caller that talks to half the
   * operations of a component says nothing the reader did not already know, and its
   * lines cross everything else; taking it out of the picture is what makes the rest
   * readable. Held by side, so a component that both calls and is called can be
   * silenced in one direction and kept in the other.
   */
  const muted = new SvelteSet<string>(hushed())

  const positions = $derived<Map<string, Position>>(
    spot === null ? new Map() : arrange(spot, view, sizes, opened),
  )

  /**
   * Every call gets its own line, pointed at the row it concerns: the operation asked
   * for, the event that raised it, the receiver that answers one. A closed card has no
   * rows to point at, and the lines meet it where they would on the map.
   */
  const arcs = $derived.by(() => {
    if (spot === null) return []

    const drawn: Arc[] = []

    for (const satellite of spot.incoming)
      if (!muted.has(satellite.id))
        for (const wire of satellite.wires)
          drawn.push({
            id: wire.id,
            from: satellite.id,
            to: spot.vertex.id,
            out: anchor(satellite.id, wire.theirs, STUB),
            in: anchor(spot.vertex.id, wire.row),
            dashed: wire.event,
            dimmed: !lit(satellite, wire),
          })

    for (const satellite of spot.outgoing)
      if (!muted.has(satellite.id))
        for (const wire of satellite.wires)
          drawn.push({
            id: wire.id,
            from: spot.vertex.id,
            to: satellite.id,
            out: anchor(spot.vertex.id, wire.row, STUB),
            in: anchor(satellite.id, wire.theirs),
            dashed: wire.event,
            dimmed: !lit(satellite, wire),
          })

    if (spot.self)
      drawn.push({
        id: 'self',
        from: spot.vertex.id,
        to: spot.vertex.id,
        dimmed: asked !== null,
      })

    return drawn
  })

  /** A line answers the question when it touches the card asked about, or leaves the row. */
  function lit(satellite: Satellite, wire: Wire): boolean {
    if (asked === null) return true

    return asked.of === 'card' ? asked.id === satellite.id : asked.id === wire.row
  }

  /**
   * Whether a card is part of the answer: the one being pointed at, or one the pointed-at
   * row talks to. Everything else steps back with its lines rather than standing there
   * lit with nothing to show for it.
   */
  function involved(satellite: Satellite): boolean {
    if (asked === null) return true

    if (asked.of === 'card') return asked.id === satellite.id

    return satellite.wires.some((wire) => wire.row === asked?.id)
  }

  /**
   * A line leaves a row past the end of its words, rather than from the side of the card
   * holding it. Without an `x` the line meets the card's own edge, which is where a card
   * showing nothing but its name is met.
   */
  function anchor(owner: string, row: string | null, stub?: number): Anchor | undefined {
    if (row === null) return undefined

    const at = lines.get(`${owner} ${row}`)

    if (at === undefined) return undefined

    return { y: at.top + at.height / 2, x: stub === undefined ? undefined : at.right + stub }
  }

  function toggle(satellite: Satellite): void {
    opened = opened === satellite.id ? null : satellite.id
  }

  /** A plain press asks about the card; a held shift takes it out of the picture, or back. */
  function touch(satellite: Satellite, shift: boolean): void {
    if (!shift) onselect(satellite.vertex.id)
    else if (muted.has(satellite.id)) muted.delete(satellite.id)
    else muted.add(satellite.id)
  }

  function at(of: string): Position {
    return positions.get(of) ?? { x: 0, y: 0 }
  }
</script>

{#if spot !== null}
  <!-- above the focused card, so a line can start beside the row it leaves, and below the
       satellites, so it passes behind them rather than across them -->
  <Edges class="text-muted-foreground/50 z-10" {arcs} {positions} {sizes} />

  {#each [...spot.incoming, ...spot.outgoing] as satellite (satellite.id)}
    <!-- the same component can stand on both sides: it is two cards, one per direction -->
    <div
      class="absolute top-0 left-0 z-20 cursor-pointer transition-opacity"
      style:translate="{at(satellite.id).x}px {at(satellite.id).y}px"
      style:width="{opened === satellite.id ? FOCUSED.width : CARD.width}px"
      style:opacity={found(satellite.vertex, $query) &&
      involved(satellite) &&
      !muted.has(satellite.id)
        ? 1
        : DIMMED}
      onmouseenter={() =>
        (asked = muted.has(satellite.id) ? null : { of: 'card', id: satellite.id })}
      onmouseleave={() => (asked = null)}
      use:measure={{ into: sizes, id: satellite.id }}
      use:rows={{ into: lines, of: satellite.id }}
      use:press={(shift) => touch(satellite, shift)}
      role="button"
      tabindex="0"
      aria-label={label(satellite.vertex)}
    >
      {#if satellite.vertex.kind === 'component'}
        <Component
          node={satellite.vertex.node}
          open={opened === satellite.id}
          ontoggle={() => toggle(satellite)}
        />
      {:else}
        <Service name={satellite.vertex.name} />
      {/if}
    </div>
  {/each}

  <div
    class="absolute top-0 left-0"
    style:translate="{at(spot.vertex.id).x}px {at(spot.vertex.id).y}px"
    style:width="{FOCUSED.width}px"
    use:measure={{ into: sizes, id: spot.vertex.id }}
    use:rows={{ into: lines, of: spot.vertex.id }}
    use:hover={(row) => (asked = row === null ? null : { of: 'row', id: row })}
  >
    <!-- a card opened by looking at it, and closed again when the map moves on -->
    {#key spot.vertex.id}
      {#if spot.vertex.kind === 'component'}
        <Node class="bg-card" node={spot.vertex.node} open />
      {:else}
        <Service name={spot.vertex.name} />
      {/if}
    {/key}
  </div>
{/if}
