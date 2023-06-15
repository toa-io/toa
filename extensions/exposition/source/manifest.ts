import { normalize } from './RTD/declaration'
import { validate } from './RTD/syntax'
import type { Manifest } from '@toa.io/norm'
import type { Node } from './RTD/syntax'

export function manifest (declaration: Node, manifest: Manifest): Node {
  const node = normalize(declaration, manifest)

  validate(node, manifest.operations)

  return node
}
