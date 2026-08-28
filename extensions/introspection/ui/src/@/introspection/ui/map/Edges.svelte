<script lang="ts">
  import { curve, entry, exit, loop, type Props } from './Edges'

  const { links, positions, sizes, class: className }: Props = $props()

  const paths = $derived(
    links
      .map((link) => {
        const from = box(link.from)
        const to = box(link.to)

        if (from === null || to === null) return null

        if (link.from === link.to) return { id: link.id, d: loop(from) }

        return { id: link.id, d: curve(exit(from, to.x), entry(to, from.x)) }
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
    <path
      d={path.d}
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      marker-end="url(#map-arrow)"
    />
  {/each}
</svg>
