import { add } from '@toa.io/generic'
import * as syntax from './syntax'

import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Manifest): RTD.Node {
  return normalizeNode(declaration, manifest.operations)
}

function normalizeNode (declaration: Node | string, operations: Operations): RTD.Node {
  const node: RTD.Node = {}

  if (typeof declaration === 'string') return normalizeMethod(declaration as operations.type, operations) as RTD.Node
  else if (Array.isArray(declaration)) return normalizeMethods(declaration, operations)

  for (const [key, value] of Object.entries(declaration)) {
    if (key[0] === '/') node[key as keyof RTD.Node] = normalizeNode(value as Node | string, operations)
    if (syntax.methods.has(key as RTD.Method)) node[key as RTD.Method] = normalizeMapping(value as Mapping, operations)
  }

  return node
}

function normalizeMethod (endpoint: string, operations: Operations): RTD.Methods {
  const type = operationType(endpoint, operations)
  const method = UNAMBIGUOUS_METHODS[type]

  if (method !== undefined) return { [method]: { endpoint, type } }
  else throw new syntax.Exception(`Ambiguous mapping for '${endpoint}'. Use explicit method declaration.`)
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

    value = { endpoint: value, type }
  }

  return value as RTD.Mapping
}

function operationType (endpoint: string, operations: Operations): operations.type {
  const type = operations?.[endpoint]?.type

  if (type === undefined) throw new syntax.Exception(`Operation '${endpoint}' is not defined.`)
  else return type
}

const UNAMBIGUOUS_METHODS: Partial<Record<operations.type, RTD.Method>> = {
  observation: 'GET',
  assignment: 'PATCH',
  computation: 'GET',
  effect: 'POST'
}

export interface Node {
  [k: string]: Node | Mapping | any // directive
}

export type Mapping = RTD.Mapping | string[] | string // operation name(s)

type Operations = Manifest['operations']
