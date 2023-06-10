import { add } from '@toa.io/generic'
import * as syntax from './syntax'

import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Manifest): RTD.Tree {
  return routes(declaration, manifest.operations)
}

function routes (declaration: Node, operations: Operations): RTD.Node {
  const node: RTD.Node = {}

  for (const [key, value] of Object.entries(declaration)) node[key] = route(value, operations)

  return node
}

function route (declaration: Node | string, operations: Operations): RTD.Node {
  const node: RTD.Node = {}

  if (typeof declaration === 'string') return method(declaration as operations.type, operations) as RTD.Node
  else if (Array.isArray(declaration)) return methods(declaration, operations)

  for (const [key, value] of Object.entries(declaration)) {
    if (key[0] === '/') node[key] = route(value as Node | string, operations)
    if (syntax.methods.has(key as RTD.method)) node[key] = mapping(value as Mapping, operations)
  }

  if (Object.keys(node).length === 0) console.log('u')
  else console.log('b')

  return node
}

function method (operation: string, operations: Operations): RTD.Methods {
  const type = operationType(operation, operations)
  const method = UNAMBIGUOUS_METHODS[type]

  if (method !== undefined) return { [method]: { operation, type } }
  else throw new Error(`Ambiguous mapping for '${operation}'. Use explicit method declaration.`)
}

function methods (values: string[], operations: Operations): RTD.Methods {
  return values.reduce((methods, value) => {
    const mtd = method(value, operations)

    add(methods, mtd)

    return methods
  }, {})
}

function mapping (value: Mapping, operations: Operations): RTD.Mapping {
  if (typeof value === 'string') {
    const type = operationType(value, operations)

    value = { operation: value, type }
  }

  return value
}

function operationType (operation: string, operations: Operations): operations.type {
  const type = operations?.[operation]?.type

  if (type === undefined) throw new Error(`Operation '${operation}' is not defined.`)
  else return type
}

const UNAMBIGUOUS_METHODS: Partial<Record<operations.type, RTD.method>> = {
  observation: 'GET',
  assignment: 'PATCH',
  computation: 'GET',
  effect: 'POST'
}

export interface Node {
  [k: string]: Node | Mapping | any // directive
}

export type Mapping = RTD.Mapping | string // operation name(s)

type Operations = Manifest['operations']
