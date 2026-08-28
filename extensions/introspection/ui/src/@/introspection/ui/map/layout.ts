import type { Graph, Vertex } from './graph'

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** The card geometry the layout reserves; the real height is measured once rendered. */
export const CARD = { width: 220, height: 76, gap: 32 }

/** A service card is a single line. `Service.svelte` is held to this, so the row below it sits right. */
export const SERVICE = { height: 40 }

/** Breathing room when the map is larger than what is looking at it. */
const PAD = 32

/**
 * The static arrangement: callers from outside in a row along the top — they are where
 * the application is entered — and components in a grid beneath them, the whole thing
 * centred in the viewport. Deliberately a pure function of the graph and the viewport:
 * the focused layouts that come next replace this and nothing else.
 */
export function grid(graph: Graph, view: Size, columns = 4): Map<string, Position> {
  const positions = new Map<string, Position>()
  const services = graph.vertices.filter((v) => v.kind === 'service')
  const components = graph.vertices.filter((v) => v.kind === 'component').sort(byName)

  const step = { x: CARD.width + CARD.gap, y: CARD.height + CARD.gap }

  services.forEach((service, i) => positions.set(service.id, { x: i * step.x, y: 0 }))

  const below = services.length > 0 ? SERVICE.height + CARD.gap : 0

  components.forEach((component, i) =>
    positions.set(component.id, {
      x: (i % columns) * step.x,
      y: below + Math.floor(i / columns) * step.y,
    }),
  )

  return centre(positions, view)
}

/** Centres what fits and pads what does not, so the map never starts in a corner. */
function centre(positions: Map<string, Position>, view: Size): Map<string, Position> {
  const content = { width: 0, height: 0 }

  for (const { x, y } of positions.values()) {
    content.width = Math.max(content.width, x + CARD.width)
    content.height = Math.max(content.height, y + CARD.height)
  }

  const offset = {
    x: Math.max(PAD, (view.width - content.width) / 2),
    y: Math.max(PAD, (view.height - content.height) / 2),
  }

  for (const [id, at] of positions) positions.set(id, { x: at.x + offset.x, y: at.y + offset.y })

  return positions
}

function byName(a: Vertex, b: Vertex): number {
  return a.id.localeCompare(b.id)
}
