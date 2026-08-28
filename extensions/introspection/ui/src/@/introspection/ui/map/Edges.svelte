<script lang="ts">
  import { DIMMED } from './layout'
  import { curve, entry, exit, loop, type Props } from './Edges'

  const { arcs, positions, sizes, class: className }: Props = $props()

  const paths = $derived(
    arcs
      .map((arc) => {
        const from = box(arc.from)
        const to = box(arc.to)

        if (from === null || to === null) return null

        const d = arc.from === arc.to
          ? loop(from)
          : curve(exit(from, to.x, arc.out), entry(to, from.x, arc.in))

        return { id: arc.id, d, dashed: arc.dashed === true, dimmed: arc.dimmed === true }
      })
      .filter((path) => path !== null),
  )

  function box(id: string) {
    const position = positions.get(id)
    const size = sizes.get(id)

    if (position === undefined || size === undefined) return null

    return { ...position, ...size }
  }
</script>

<svg class={['pointer-events-none absolute overflow-visible', className]} aria-hidden="true">
  <defs>
    <marker
      id="map-arrow"
      viewBox="0 0 8 8"
      refX="7"
      refY="4"
      markerWidth="8"
      markerHeight="8"
      orient="auto-start-reverse"
    >
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
    </marker>
  </defs>

  {#each paths as path (path.id)}
    <!-- dashed says an event raised the call rather than one component asking for it -->
    <path
      d={path.d}
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-dasharray={path.dashed ? '4 3' : undefined}
      opacity={path.dimmed ? DIMMED : undefined}
      class="transition-opacity"
      marker-end="url(#map-arrow)"
    />
  {/each}
</svg>
