import { normalize } from './RTD/declaration'
import { validate } from './RTD/syntax'

import type { Manifest } from '@toa.io/norm'
import type { Node } from './RTD/syntax'

export function manifest (node: Node, manifest: Manifest): Node {
  node = normalize(node, manifest)
  validate(node, manifest.operations)

  return node
}
