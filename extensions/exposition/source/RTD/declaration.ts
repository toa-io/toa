import { methods } from './syntax'

import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Manifest): RTD.Node {
  return routes(declaration, manifest)
}

function routes (declaration: Node, manifest: Manifest): RTD.Node {
  const node: RTD.Node = {}

  for (const [key, value] of Object.entries(declaration)) node[key] = route(value, manifest)

  return node
}

function route (declaration: Node | string, manifest: Manifest): RTD.Node {
  const node: RTD.Node = {}

  if (typeof declaration === 'string') return method(declaration as operations.type, manifest) as RTD.Node

  for (const [key, value] of Object.entries(declaration)) {
    if (key[0] === '/') node[key] = route(value as Node | string, manifest)
    if (methods.has(key as RTD.method)) node[key as RTD.method] = mapping(value as Mapping, manifest)
  }

  return node
}

function mapping (value: Mapping, manifest: Manifest): RTD.Mapping {
  if (typeof value === 'string') {
    const type = operationType(value, manifest)

    value = { operation: value, type }
  }

  return value
}

function method (operation: string, manifest: Manifest): RTD.Methods {
  const type = operationType(operation, manifest)
  const method = UNAMBIGUOUS_METHODS[type]

  if (method !== undefined) return { [method]: mapping(operation, manifest) }
  else throw new Error(`Ambiguous mapping for '${operation}'. Use explicit method declaration.`)
}

function operationType (operation: string, manifest: Manifest): operations.type {
  const type = manifest.operations?.[operation]?.type

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
  [k: string]: Node | Mapping | string | any // directive
}

export type Mapping = RTD.Mapping | string // operation name
