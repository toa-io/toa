import { methods } from './syntax'

import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Partial<Manifest>): RTD.Node {
  return routes(declaration, manifest)
}

function routes (declaration: Node, manifest: Partial<Manifest>): RTD.Node {
  const node: RTD.Node = {}

  for (const [key, value] of Object.entries(declaration)) node[key] = route(value, manifest)

  return node
}

function route (declaration: Node | string, manifest: Partial<Manifest>): RTD.Node {
  const node: RTD.Node = {}

  if (typeof declaration === 'string') return method(declaration as operations.type, manifest) as RTD.Node

  for (let [key, value] of Object.entries(declaration)) {
    if (key[0] === '/') node[key] = route(value as Node | string, manifest)
    if (methods.has(key as RTD.method)) node[key as RTD.method] = mapping(value as Mapping, key as RTD.method, manifest)
  }

  return node
}

function mapping (value: Mapping, method: RTD.method, manifest: Partial<Manifest>): RTD.Mapping {
  if (typeof value === 'string') value = { operation: value as operations.type }

  if (!methods.has(method)) throw new Error('')

  const type = operationType(value.operation, manifest)
  const allowedTypes = ALLOWED_MAPPINGS[method]

  if (!allowedTypes.has(type)) throw new Error(`Method '${method}' cannot be mapped to '${type}'. Allowed operation types: '${[...allowedTypes].join('\', \'')}'`)

  return value as RTD.Mapping
}

function method (operation: operations.type, manifest: Partial<Manifest>): RTD.Methods {
  const type = operationType(operation, manifest)
  const method = UNAMBIGUOUS_METHODS[type]

  if (method !== undefined) return { [method]: mapping(operation, method, manifest) }
  else throw new Error(`Ambiguous mapping for '${operation}'. Use explicit method declaration.`)
}

function operationType (operation: string, manifest: Partial<Manifest>): operations.type {
  const type = manifest.operations?.[operation]?.type

  if (type === undefined) throw new Error(`Operation '${operation}' is not defined.`)
  else return type
}

const UNAMBIGUOUS_METHODS: Partial<Record<operations.type, RTD.method>> = {
  'observation': 'GET',
  'assignment': 'PATCH',
  'computation': 'GET',
  'effect': 'POST'
}

const ALLOWED_MAPPINGS: Record<RTD.method, Set<operations.type>> = {
  'GET': new Set(['observation', 'computation']),
  'POST': new Set(['transition', 'effect']),
  'PUT': new Set(['transition']),
  'PATCH': new Set(['assignment']),
  'DELETE': new Set()
}

export type Node = {
  [k: string]: Node | Mapping | string | any
}

export type Mapping = RTD.Mapping | string // operation name

