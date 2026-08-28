import { origin } from '@/net'
import type { Node } from './Node'
import type { Edge } from './Edge'

// How much of the map comes back is the manifests' call, not this client's.
const nodes = origin.resource<Node[]>('/introspection/nodes/')
const edges = origin.resource<Edge[]>('/introspection/edges/')

export async function get(): Promise<Node[] | Error> {
  return await nodes.json({ credentials: 'include' })
}

export async function list(): Promise<Edge[] | Error> {
  return await edges.json({ credentials: 'include' })
}
