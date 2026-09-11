import type { Ports } from './processes.ts'
import type { Pair } from './run.ts'

/** Where a revision runs: a vhost and a database of one name, and the ports its processes bind. */
export interface Slot {
  context: string
  ports: Ports
}

/** Two slots that differ in names only: contexts of one length, ports of one block. */
export const SLOTS: { a: Slot; b: Slot } = {
  a: { context: 'toa-bench-a', ports: { gateway: 31090, probe: 31092, ready: [31094, 31095, 31098] } },
  b: { context: 'toa-bench-b', ports: { gateway: 31091, probe: 31093, ready: [31096, 31097, 31099] } }
}

/**
 * The slot each revision takes in a block. A slot can cost more than the other for reasons of its
 * own — its names, its ports, booting and seeding first — so the revisions swap slots every block,
 * and whatever a slot costs falls on each of them equally.
 */
export function assign(block: number): Pair<Slot> {
  return block % 2 === 0 ? { base: SLOTS.a, head: SLOTS.b } : { base: SLOTS.b, head: SLOTS.a }
}
