import { origin } from '@/net'
import type { Node } from './Node'
import type { Edge } from './Edge'

const nodes = origin.resource<Node[]>('/introspection/nodes/')
const edges = origin.resource<Edge[]>('/introspection/edges/')

const MINUTE = 60 * 1000
const NODES_MAX_AGE = 75 * MINUTE
const EDGES_MAX_AGE = 12.5 * MINUTE

export async function get(): Promise<Node[] | Error> {
  return await nodes.json(updatedSince(NODES_MAX_AGE), { credentials: 'include' })
}

export async function list(): Promise<Edge[] | Error> {
  return await edges.json(updatedSince(EDGES_MAX_AGE), { credentials: 'include' })
}

function updatedSince(maxAge: number): string {
  const params = new URLSearchParams({ criteria: `_updated>${Date.now() - maxAge}` })

  return `?${params.toString()}`
}
