import type { Edge, Input } from './lib/types'

/**
 * Records the calls observed by a collector since its last flush.
 *
 * The scope is `objects`, so the caller passes every affected id in `query.ids`
 * and the matching edge under `edges[id]`. Unknown edges are initialized by the
 * runtime, since the entity is `associated`.
 */
export function transition (input: Input, objects: Edge[]): Edge[] {
  for (const edge of objects) {
    const observed = input.edges[edge.id]

    if (observed === undefined)
      continue

    edge.src = observed.src
    edge.dst = observed.dst

    // absent when sampling is off, and the last one wins otherwise
    if (observed.sample !== undefined)
      edge.sample = observed.sample
  }

  return objects
}
