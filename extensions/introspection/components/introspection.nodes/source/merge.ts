import type { Entity, MergeInput } from '../types/index.d.ts'

/**
 * Records the components described by a collector since its last flush.
 *
 * The scope is `entries`, so the caller passes every affected id in `query.ids`
 * and the matching description under `nodes[id]`. Unknown nodes are initialized
 * by the runtime, since the entity is `associated`.
 */
export function transition(input: MergeInput, entries: Entity[]): Entity[] {
  for (const node of entries) {
    const described = input.nodes[node.id]

    if (described === undefined) continue

    Object.assign(node, described)
  }

  return entries
}
