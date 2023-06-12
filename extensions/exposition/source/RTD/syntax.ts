import { schema } from './schema'

import type { Manifest } from '@toa.io/norm'
import type * as core from '@toa.io/core'

export function validate (node: Node, operations: Operations): void {
  schema.validate(node)
  testNode(node, testMethod(operations))
}

function testNode (node: Node, testMethod: (method: Method, mapping: Mapping) => void): void {
  const transient = '/' in node

  for (const [key, value] of Object.entries(node))
    if (key[0] === '/') testNode(value, testMethod)
    else if (methods.has(key as Method))
      if (transient) throw new Exception('Methods of intermediate Nodes are unreachable. Move the declaration to the \'/\' key.')
      else testMethod(key as Method, value as Mapping)
}

function testMethod (operations: Operations): (method: Method, mapping: Mapping) => void {
  return (method: Method, mapping: Mapping): void => {
    const allowedTypes = ALLOWED_MAPPINGS[method]

    if (!allowedTypes.has(mapping.type))
      throw new Exception(`Method '${method}' cannot be mapped to '${mapping.type}'. ` +
        `Allowed operation types: '${[...allowedTypes].join('\', \'')}'.`)

    if (!(mapping.operation in operations))
      throw new Exception(`Method '${method}' is mapped to undefined operation '${mapping.operation}'`)
  }
}

export const methods = new Set<Method>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

export class Exception extends Error {
  public constructor (message: string) {
    super('RTD syntax error: ' + message)
  }
}

const ALLOWED_MAPPINGS: Record<Method, Set<core.operations.type>> = {
  GET: new Set(['observation', 'computation']),
  POST: new Set(['transition', 'effect']),
  PUT: new Set(['transition']),
  PATCH: new Set(['assignment']),
  DELETE: new Set()
}

export type Node = Routes | Methods | Directives

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface Routes {
  [k: string]: Node
}

export type Methods = Partial<Record<Method, Mapping>>

export type Directives = Record<string, any>

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface Mapping {
  operation: string
  type: core.operations.type
  query?: object
}

export interface Branch {
  name: string
  namespace: string
  node: Node
}

type Operations = Manifest['operations']
