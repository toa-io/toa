import { parse, type Node } from './RTD/syntax'
import { shortcuts } from './Directive'
import type { Manifest } from '@toa.io/norm'

export function manifest (declaration: object, manifest: Manifest): Node {
  declaration = wrap(manifest.name, declaration)

  if (manifest.namespace !== undefined && manifest.namespace !== 'default')
    declaration = wrap(manifest.namespace, declaration)

  const node = parse(declaration, shortcuts)

  concretize(node, manifest)

  return node
}

function wrap (segment: string, declaration: object): object {
  return { ['/' + segment]: { protected: true, ...declaration } }
}

function concretize (node: Node, manifest: Manifest): void {
  for (const route of node.routes) {
    for (const method of route.node.methods) {
      method.mapping.namespace = manifest.namespace
      method.mapping.component = manifest.name
    }

    concretize(route.node, manifest)
  }
}
