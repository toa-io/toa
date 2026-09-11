import { parse, type Node, type Method, type Query } from './syntax/index.ts'
import { shortcuts } from './shortcuts.ts'
import * as schemas from './schemas.ts'
import type { Manifest } from '@toa.io/norm'

export function manifest(declaration: object, manifest: Manifest): Node {
  if (!(typeof declaration === 'object' && declaration !== null))
    throw new Error('Exposition declaration must be an object')

  declaration = wrap(declaration, manifest.namespace, manifest.name)

  const node = parse(declaration, shortcuts)

  specify(node, manifest)
  schemas.node.validate(node)

  return node
}

function wrap(declaration: object, namespace: string, name: string): object {
  const path =
    (namespace === undefined || namespace === 'default' ? '' : '/' + namespace) +
    '/' +
    name

  return { [path]: declaration }
}

function specify(node: Node, manifest: Manifest): void {
  for (const route of node.routes) {
    for (const method of route.node.methods) specifyMethod(method, manifest)

    specify(route.node, manifest)
  }
}

function specifyMethod(method: Method, manifest: Manifest): void {
  if (method.mapping?.endpoint === undefined) return

  const operation = manifest.operations[method.mapping.endpoint]

  if (operation === undefined)
    throw new Error(`Operation '${method.mapping.endpoint}' not found`)

  if (method.mapping.query === undefined)
    method.mapping.query = operation.query === false ? null : ({} as unknown as Query)

  // a page is taken of a collection, and of nothing else: an operation that answers one object
  // takes no `omit` and no `limit`, and refuses a request that carries them
  method.mapping.paged = operation.type === 'observation' && operation.scope === 'objects'

  method.mapping.namespace = manifest.namespace
  method.mapping.component = manifest.name
}
