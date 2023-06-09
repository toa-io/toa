import { schema } from './schema'

export function validate (node: Node, operations: Operations): void {
  schema.validate(node)
  eachMethod(node, testMethod(operations))
}

function eachMethod (node: Node, test: (method: method, mapping: Mapping) => void) {
  for (const [key, value] of Object.entries(node)) {
    if (key[0] === '/') eachMethod(value, test)
    else if (methods.has(key as method)) test(key as method, value as Mapping)
  }
}

function testMethod (operations: Operations): (method: method, mapping: Mapping) => void {
  return (method: method, mapping: Mapping) => {
    const allowedTypes = ALLOWED_MAPPINGS[method]

    if (!allowedTypes.has(mapping.type)) throw new Error(
      `Method '${method}' cannot be mapped to '${mapping.type}'. ` +
      `Allowed operation types: '${[...allowedTypes].join('\', \'')}'.`
    )

    if (!(mapping.operation in operations)) throw new Error(
      `Method '${method}' is mapped to undefined operation '${mapping.operation}'`
    )
  }
}

export const methods: Set<method> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

const ALLOWED_MAPPINGS: Record<method, Set<core.operations.type>> = {
  'GET': new Set(['observation', 'computation']),
  'POST': new Set(['transition', 'effect']),
  'PUT': new Set(['transition']),
  'PATCH': new Set(['assignment']),
  'DELETE': new Set()
}

import type { Manifest } from '@toa.io/norm'
import type * as core from '@toa.io/core'

export type Node = {
  [k: string]: Routes | Methods | Directives
}

type Routes = {
  [k: string]: Node
}

export type Methods = {
  [k in method]?: Mapping
}

type Directives = {
  [k: string]: any
}

export type method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Mapping = {
  operation: string
  type: core.operations.type
  query?: object
}

type Operations = Manifest['operations']
