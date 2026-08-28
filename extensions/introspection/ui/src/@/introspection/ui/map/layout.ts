import type { Focus, Graph, Satellite, Vertex } from './graph'

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

/** The focused card shows everything the component declares, so it is given the room. */
export const FOCUSED = { width: 400, height: 320 }

/** What the filter and the pointer both fade a card down to — one rule, both causes. */
export const DIMMED = 0.25

/** Air between the end of a row and the line that leaves it. */
export const STUB = 8

/** More neighbours than this on one side, and that side becomes two columns. */
const COLUMN = 6

/** Breathing room when the map is larger than what is looking at it. */
const PAD = 32

/**
 * The static arrangement: the components in a grid, and the callers from outside in a
 * row beneath them, the whole thing centred in the viewport.
 */
export function grid(graph: Graph, view: Size, columns = 4): Map<string, Position> {
  const positions = new Map<string, Position>()
  const services = graph.vertices.filter((v) => v.kind === 'service')
  const components = graph.vertices.filter((v) => v.kind === 'component').sort(byName)

  const step = { x: CARD.width + CARD.gap, y: CARD.height + CARD.gap }

  components.forEach((component, i) =>
    positions.set(component.id, {
      x: (i % columns) * step.x,
      y: Math.floor(i / columns) * step.y,
    }),
  )

  const under = Math.ceil(components.length / columns) * step.y

  services.forEach((service, i) => positions.set(service.id, { x: i * step.x, y: under }))

  // a service card is a line rather than a card, and the row of them is what the map now
  // ends with: reserving a whole card for it would centre the map around nothing
  const heights = new Map(services.map((service) => [service.id, SERVICE.height]))

  return centre(positions, view, (id) => ({
    width: CARD.width,
    height: heights.get(id) ?? CARD.height,
  }))
}

/**
 * One card and its immediate company: what calls it to the left, what it calls to the
 * right, itself in the middle. Reading left to right is reading the direction of the
 * call, which is why a component that does both appears on both sides.
 */
export function arrange(
  focus: Focus,
  view: Size,
  sizes: Map<string, Size>,
  open: string | null = null,
): Map<string, Position> {
  const positions = new Map<string, Position>([[focus.vertex.id, { x: 0, y: 0 }]])
  const middle = size(sizes, focus.vertex.id, FOCUSED).height / 2

  place(focus.incoming, -1)
  place(focus.outgoing, 1)

  return centre(positions, view, (id) =>
    size(sizes, id, id === focus.vertex.id ? FOCUSED : CARD),
  )

  /**
   * A side of the focused card: columns growing away from it, each stack centred on it.
   * An opened card is wider, and it widens outwards — the lane between the column and
   * the focused card is where the lines run, and it stays where it was.
   */
  function place(satellites: Satellite[], direction: -1 | 1): void {
    const step = CARD.width + CARD.gap

    columns(satellites).forEach((column, index) => {
      const lane = CARD.gap + index * step
      const heights = column.map((satellite) => size(sizes, satellite.id, CARD).height)
      const total = heights.reduce((sum, height) => sum + height, 0) + CARD.gap * (column.length - 1)

      let y = middle - total / 2

      column.forEach((satellite, at) => {
        const width = satellite.id === open ? FOCUSED.width : CARD.width

        positions.set(satellite.id, {
          x: direction < 0 ? -(lane + width) : FOCUSED.width + lane,
          y,
        })

        y += heights[at] + CARD.gap
      })
    })
  }
}

/** A side long enough to run off the screen is halved rather than made to scroll. */
function columns(satellites: Satellite[]): Satellite[][] {
  if (satellites.length === 0) return []

  if (satellites.length <= COLUMN) return [satellites]

  const half = Math.ceil(satellites.length / 2)

  return [satellites.slice(0, half), satellites.slice(half)]
}

function size(sizes: Map<string, Size>, id: string, fallback: Size): Size {
  return sizes.get(id) ?? fallback
}

/** Centres what fits and pads what does not, so an arrangement never starts in a corner. */
function centre(
  positions: Map<string, Position>,
  view: Size,
  size: (id: string) => Size,
): Map<string, Position> {
  if (positions.size === 0) return positions

  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }

  for (const [id, at] of positions) {
    const { width, height } = size(id)

    bounds.left = Math.min(bounds.left, at.x)
    bounds.top = Math.min(bounds.top, at.y)
    bounds.right = Math.max(bounds.right, at.x + width)
    bounds.bottom = Math.max(bounds.bottom, at.y + height)
  }

  const content = { width: bounds.right - bounds.left, height: bounds.bottom - bounds.top }

  const offset = {
    x: Math.max(PAD, (view.width - content.width) / 2) - bounds.left,
    y: Math.max(PAD, (view.height - content.height) / 2) - bounds.top,
  }

  for (const [id, at] of positions) positions.set(id, { x: at.x + offset.x, y: at.y + offset.y })

  return positions
}

function byName(a: Vertex, b: Vertex): number {
  return a.id.localeCompare(b.id)
}
