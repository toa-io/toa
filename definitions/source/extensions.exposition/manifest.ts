import { parse, type Node, type Method, type Query } from './syntax/index.ts'
import { shortcuts } from './shortcuts.ts'
import * as schemas from './schemas.ts'
import type { component, Manifest } from '@toa.io/norm'

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

  projects(method, operation.type)
  streams(method, operation)

  method.mapping.namespace = manifest.namespace
  method.mapping.component = manifest.name
}

/**
 * A method that maps a stream maps it onto an operation that takes one, and takes the request
 * once: `map:buffer` reads the same body this hands over.
 */
function streams(method: Method, operation: component.Operation): void {
  const mapped = method.directives.find(
    (directive) => directive.family === 'map' && directive.name === 'stream'
  )

  if (mapped === undefined) return

  const endpoint = method.mapping?.endpoint

  if (operation.stream === undefined)
    throw new Error(
      `Method of '${endpoint}' maps a stream, which the operation does not take`
    )

  const buffered = method.directives.some(
    (directive) => directive.family === 'map' && directive.name === 'buffer'
  )

  if (buffered)
    throw new Error(
      `Method of '${endpoint}' maps both a stream and a buffer, and each takes the request`
    )
}

/**
 * What a route projects is what its operation's storage reads, and a read that is written back
 * reads the whole record.
 */
function projects(method: Method, type: string): void {
  const projection = method.mapping?.query?.projection

  if (projection === undefined) return

  const endpoint = method.mapping?.endpoint

  if (type !== 'observation')
    throw new Error(
      `Method of '${endpoint}' declares a projection, which an operation of type ` +
        `'${type}' does not read`
    )

  if (projection.includes('id'))
    throw new Error(`Projection of '${endpoint}' names 'id', which is always read`)
}
