import type { Input, Node } from './lib/types'

/**
 * Records the components described by a collector since its last flush.
 *
 * The scope is `objects`, so the caller passes every affected id in `query.ids`
 * and the matching description under `nodes[id]`. Unknown nodes are initialized
 * by the runtime, since the entity is `associated`.
 */
export function transition (input: Input, objects: Node[]): Node[] {
  for (const node of objects) {
    const described = input.nodes[node.id]

    if (described === undefined)
      continue

    Object.assign(node, described)
  }

  return objects
}
