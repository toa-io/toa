import assert from 'node:assert'
import { parse, type Node, type Method, type Query } from './RTD/syntax'
import { shortcuts } from './Directive'
import * as schemas from './schemas'
import type { Manifest } from '@toa.io/norm'

export function manifest (declaration: object, manifest: Manifest): Node {
  assert.ok(typeof declaration === 'object' && declaration !== null,
    'Exposition declaration must be an object')

  declaration = wrap(declaration, manifest.namespace, manifest.name)

  const node = parse(declaration, shortcuts)

  concretize(node, manifest)
  schemas.node.validate(node)

  return node
}

function wrap (declaration: object, namespace: string, name: string): object {
  const path = (namespace === undefined || namespace === 'default' ? '' : '/' + namespace) +
    '/' + name

  return { [path]: { protected: true, ...declaration } }
}

function concretize (node: Node, manifest: Manifest): void {
  for (const route of node.routes) {
    for (const method of route.node.methods)
      concretizeMethod(method, manifest)

    concretize(route.node, manifest)
  }
}

function concretizeMethod (method: Method, manifest: Manifest): void {
  if (method.mapping === undefined)
    return

  const operation = manifest.operations[method.mapping.endpoint]

  if (operation === undefined)
    throw new Error(`Operation '${method.mapping.endpoint}' not found`)

  if (method.mapping.query === undefined && operation.query !== false)
    method.mapping.query = {} as unknown as Query // schema will substitute default values

  method.mapping.namespace = manifest.namespace
  method.mapping.component = manifest.name
}
