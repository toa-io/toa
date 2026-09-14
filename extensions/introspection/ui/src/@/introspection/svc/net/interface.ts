import { origin } from '@/net'
import type { Node } from './Node'
import type { Configuration } from './Halt'
import type { Edge } from './Edge'

const nodes = origin.resource<Node[]>('/introspection/nodes/')
const edges = origin.resource<Edge[]>('/introspection/edges/')
const signals = origin.resource('/introspection/signals/', { credentials: 'include' })

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE
const NODES_MAX_AGE = 75 * MINUTE
const EDGES_MAX_AGE = 7 * DAY

export async function get(): Promise<Node[] | Error> {
  return await nodes.json(updatedSince(NODES_MAX_AGE), { credentials: 'include' })
}

export async function list(): Promise<Edge[] | Error> {
  return await edges.json(updatedSince(EDGES_MAX_AGE), { credentials: 'include' })
}

/** What a signal may ask for: the deployment's own, and what every process holds one to. */
export async function configuration(): Promise<Configuration | Error> {
  return await signals.json<Configuration>()
}

/**
 * Writes a halt, which every process of the deployment hears. What answers is the record
 * having been written; what it does happens to this page too.
 */
export async function halt(seconds: number, quiescence: number): Promise<void | Error> {
  const written = await signals.json({
    method: 'POST',
    body: { type: 'halt', seconds, quiescence },
  })

  return written instanceof Error ? written : undefined
}

function updatedSince(maxAge: number): string {
  const params = new URLSearchParams({ criteria: `UPDATED>${Date.now() - maxAge}` })

  return `?${params.toString()}`
}
