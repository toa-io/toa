import type { ClassValue } from 'svelte/elements'
import type { Position, Size } from './layout'

/** Where a line meets a card, as offsets from that card's top left corner. */
export interface Anchor {
  y: number
  /** Where the line leaves the row itself; without it the line meets the card's side. */
  x?: number
}

/** One line on the map, addressed to the cards it joins and, where it has one, a row. */
export interface Arc {
  id: string
  from: string
  to: string
  /**
   * A card showing its rows is left and met at the row concerned; a card showing only
   * its name is left and met as a whole.
   */
  out?: Anchor
  in?: Anchor
  /** Raised by an event rather than called outright. */
  dashed?: boolean
  /** Not what the pointer is asking about, so it steps back rather than disappears. */
  dimmed?: boolean
}

export interface Props {
  arcs: Arc[]
  positions: Map<string, Position>
  sizes: Map<string, Size>
  class?: ClassValue
}

export interface Point {
  x: number
  y: number
}

type Box = Position & Size

/**
 * Direction is read off the height rather than the side: what a card receives meets it
 * high, what it sends leaves low. The side stays whichever one faces the other card,
 * which is what keeps the lines short.
 */
const ENTRY = 1 / 3
const EXIT = 2 / 3

export function exit(box: Box, towards: number, at?: Anchor): Point {
  return point(box, towards, at, EXIT)
}

export function entry(box: Box, towards: number, at?: Anchor): Point {
  return point(box, towards, at, ENTRY)
}

function point(box: Box, towards: number, at: Anchor | undefined, share: number): Point {
  return {
    x: at?.x === undefined ? side(box, towards) : box.x + at.x,
    y: box.y + (at?.y ?? box.height * share),
  }
}

export function curve(from: Point, to: Point): string {
  const bend = Math.max(40, Math.abs(to.x - from.x) / 2)
  const out = from.x < to.x ? bend : -bend

  return `M${from.x},${from.y} C${from.x + out},${from.y} ${to.x - out},${to.y} ${to.x},${to.y}`
}

/** A component calling its own operations: a loop under the card. */
export function loop(box: Box): string {
  const x = box.x + box.width / 2
  const y = box.y + box.height
  const r = 28

  return `M${x - 10},${y} C${x - r},${y + r} ${x + r},${y + r} ${x + 10},${y}`
}

function side(box: Box, towards: number): number {
  return towards >= box.x + box.width / 2 ? box.x + box.width : box.x
}
