import { add } from '@toa.io/generic'
import * as syntax from './syntax'

import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Manifest): RTD.Node {
  return normalizeNode(declaration, manifest.operations)
}

function normalizeNode (declaration: Node | string, operations: Operations): RTD.Node {
  const node: RTD.Node = { '': null } // prevents compilation errors that I was unable to resolve

  if (typeof declaration === 'string') return normalizeMethod(declaration as operations.type, operations) as RTD.Node
  else if (Array.isArray(declaration)) return normalizeMethods(declaration, operations)

  for (const [key, value] of Object.entries(declaration)) {
    if (key[0] === '/') node[key] = normalizeNode(value as Node | string, operations)
    if (syntax.methods.has(key as RTD.method)) node[key] = normalizeMapping(value as Mapping, operations)
  }

  delete node[''] // see above

  return node
}

function normalizeMethod (operation: string, operations: Operations): RTD.Methods {
  const type = operationType(operation, operations)
  const method = UNAMBIGUOUS_METHODS[type]

  if (method !== undefined) return { [method]: { operation, type } }
  else throw new Error(`Ambiguous mapping for '${operation}'. Use explicit method declaration.`)
}

function normalizeMethods (values: string[], operations: Operations): RTD.Methods {
  return values.reduce((methods, value) => {
    const metod = normalizeMethod(value, operations)

    add(methods, metod)

    return methods
  }, {})
}

function normalizeMapping (value: Mapping, operations: Operations): RTD.Mapping {
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
