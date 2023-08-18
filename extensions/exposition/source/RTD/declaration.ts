import { add } from '@toa.io/generic'
import * as syntax from './syntax'
import type * as RTD from './syntax'
import type { Manifest } from '@toa.io/norm'
import type { operations } from '@toa.io/core'

export function normalize (declaration: Node, manifest: Manifest): RTD.Node {
  return normalizeNode(declaration, manifest)
}

function normalizeNode (declaration: Node | string, manifest: Manifest): RTD.Node {
  const node: RTD.Node = {}

  if (typeof declaration === 'string')
    return normalizeMethod(declaration as operations.type, manifest) as RTD.Node
  else if (Array.isArray(declaration))
    return normalizeMethods(declaration, manifest)

  for (const [key, value] of Object.entries(declaration)) {
    if (key[0] === '/')
      node[key] = normalizeNode(value as Node | string, manifest)

    if (syntax.methods.has(key))
      node[key] = normalizeMapping(value as Mapping, manifest)
  }

  return node
}

function normalizeMethod (endpoint: string, manifest: Manifest): RTD.Methods {
  const mapping = normalizeMapping(endpoint, manifest)
  const method = UNAMBIGUOUS_METHODS[mapping.type]

  if (method !== undefined)
    return { [method]: mapping }
  else
    throw new syntax.Exception(`Ambiguous mapping for '${endpoint}'. ` +
      'Use explicit method declaration.')
}

function normalizeMethods (values: string[], manifest: Manifest): RTD.Methods {
  return values.reduce((methods, value) => {
    const metod = normalizeMethod(value, manifest)

    add(methods, metod)

    return methods
  }, {})
}

function normalizeMapping (mapping: Mapping, manifest: Manifest): RTD.Mapping {
  const namespace = manifest.namespace
  const component = manifest.name
  const endpoint: string = typeof mapping === 'string' ? mapping : mapping.endpoint
  const type = operationType(endpoint, manifest.operations)

  mapping = mapping as RTD.Mapping

  const query = mapping.query

  if (query !== undefined) {
    query.omit = normalizeRange(query.omit)
    query.limit = normalizeRange(query.limit)
  }

  return { namespace, component, endpoint, type, query }
}

function operationType (endpoint: string, operations: Operations): operations.type {
  const type = operations?.[endpoint]?.type

  if (type === undefined) throw new syntax.Exception(`Operation '${endpoint}' is not defined.`)
  else return type
}

function normalizeRange (range: RTD.Range | number | [number, number]): RTD.Range {
  if (typeof range === 'number')
    return { value: range, range: [range, range] }

  if (Array.isArray(range))
    return { range }

  return range
}

const UNAMBIGUOUS_METHODS: Partial<Record<operations.type, RTD.Method>> = {
  observation: 'GET',
  assignment: 'PATCH',
  computation: 'GET'
}

export interface Node {
  [k: string]: Node | Mapping | any // directive
}

export type Mapping = RTD.Mapping | string // operation name(s)

type Operations = Manifest['operations']
