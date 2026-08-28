import { identify, matches, rank, shorten } from '../ui'

import type { Edge, Node } from '@/introspection'

/** A component of the application, as its manifest describes it. */
export interface Component {
  kind: 'component'
  id: string
  node: Node
}

/** A caller from outside the map — the gateway, the realtime service. */
export interface Service {
  kind: 'service'
  id: string
  name: string
}

export type Vertex = Component | Service

/** Every call observed between two vertices, collapsed into one line. */
export interface Link {
  id: string
  from: string
  to: string
  calls: number
  /** How many of those an event caused rather than one component calling another. */
  events: number
}

export interface Graph {
  vertices: Vertex[]
  links: Link[]
  /** The calls the map was built from, kept for the arrangements that draw them one by one. */
  calls: Edge[]
}

/**
 * The map as it is drawn. Two thirds of the edges of a running application start at a
 * service rather than a component, so services are vertices here in their own right.
 */
export function build(nodes: Node[], edges: Edge[]): Graph {
  const components = nodes.map((node): Component => ({ kind: 'component', id: identify(node), node }))
  const services = new Map<string, Service>()
  const links = new Map<string, Link>()

  for (const edge of edges) {
    const from = origin(edge.src)
    const to = identify(edge.dst)

    if ('service' in edge.src)
      services.set(from, { kind: 'service', id: from, name: edge.src.service })

    const link = links.get(`${from} ${to}`)
    const events = caused(edge) ? 1 : 0

    if (link === undefined) links.set(`${from} ${to}`, { id: `${from} ${to}`, from, to, calls: 1, events })
    else {
      link.calls++
      link.events += events
    }
  }

  return { vertices: [...services.values(), ...components], links: [...links.values()], calls: edges }
}

function origin(src: Edge['src']): string {
  return 'service' in src ? `svc:${src.service}` : identify(src)
}

/** Whether the call was raised by an event rather than made by whoever wanted it. */
function caused(edge: Edge): boolean {
  return 'event' in edge.src
}

/** The connections of one vertex. Nothing is drawn until a card is pointed at. */
export function touching(links: Link[], of: string | null): Link[] {
  if (of === null) return []

  return links.filter((link) => link.from === of || link.to === of)
}

/** The vertex itself and everything it is connected to, in either direction. */
export function neighbours(links: Link[], of: string | null): Set<string> {
  const set = new Set<string>()

  if (of === null) return set

  set.add(of)

  for (const link of links) {
    if (link.from === of) set.add(link.to)

    if (link.to === of) set.add(link.from)
  }

  return set
}

/** What the card is called when it is read out rather than drawn. */
export function label(vertex: Vertex): string {
  return vertex.kind === 'component' ? shorten(vertex.id) : vertex.name
}

/** Whether the filter admits a card: a component by all it declares, a service by its name. */
export function found(vertex: Vertex, query: string): boolean {
  return vertex.kind === 'component' ? rank(vertex.node, query) > 0 : matches(vertex.name, query)
}

/** One call between the focused card and a neighbour, named by the rows it concerns. */
export interface Wire {
  id: string
  /**
   * The row of the focused card the line touches — an operation it is asked for, an
   * event it raises, a receiver that answers one. Null where the card has no such row:
   * a service, or a card the reader has closed.
   */
  row: string | null
  /** The same on the neighbour's card, read from its end of the call. */
  theirs: string | null
  /** Raised by an event rather than called outright, which is what draws it dashed. */
  event: boolean
}

/** One neighbour of the focused card, and everything said between them in that direction. */
export interface Satellite {
  /**
   * Its own, not the vertex's: a component that both calls the focused one and is called
   * by it stands on both sides, as two cards.
   */
  id: string
  vertex: Vertex
  wires: Wire[]
}

export interface Focus {
  vertex: Vertex
  incoming: Satellite[]
  outgoing: Satellite[]
  /** A component calling itself has no side to stand on, so it keeps its loop instead. */
  self: boolean
}

/** The one card being looked at, and everything that talks to it, sorted by side. */
export function focus(graph: Graph, id: string): Focus | null {
  const looked = graph.vertices.find((vertex) => vertex.id === id)

  if (looked === undefined) return null

  const vertices = new Map(graph.vertices.map((vertex) => [vertex.id, vertex]))
  const incoming = new Map<string, Satellite>()
  const outgoing = new Map<string, Satellite>()

  let self = false

  for (const call of graph.calls) {
    const from = origin(call.src)
    const to = identify(call.dst)

    if (from === id && to === id) {
      self = true

      continue
    }

    const side = to === id ? 'in' : from === id ? 'out' : null

    if (side === null) continue

    const of = side === 'in' ? from : to
    const neighbour = vertices.get(of)

    // an edge can name a component that has never reported itself; there is no card for it
    if (neighbour === undefined) continue

    // a call leaves one card and arrives at the other; which end is which is the side
    const ends =
      side === 'in'
        ? { row: arrival(looked, call), theirs: departure(call) }
        : { row: departure(call), theirs: arrival(neighbour, call) }

    wire(side === 'in' ? incoming : outgoing, `${side}:${of}`, neighbour, ends, caused(call))
  }

  return {
    vertex: looked,
    incoming: [...incoming.values()].sort(byVertex),
    outgoing: [...outgoing.values()].sort(byVertex),
    self,
  }
}

type Ends = Pick<Wire, 'row' | 'theirs'>

function wire(
  into: Map<string, Satellite>,
  at: string,
  vertex: Vertex,
  ends: Ends,
  event: boolean,
): void {
  let satellite = into.get(at)

  if (satellite === undefined) {
    satellite = { id: at, vertex, wires: [] }
    into.set(at, satellite)
  }

  const drawn = { ...ends, id: `${at} ${ends.row} ${ends.theirs} ${event}`, event }

  if (!satellite.wires.some((wire) => wire.id === drawn.id)) satellite.wires.push(drawn)
}

/** Where a call arrives: the operation asked for, or the receiver an event woke. */
function arrival(vertex: Vertex, call: Edge): string | null {
  if (vertex.kind !== 'component') return null

  const src = call.src

  if ('event' in src) {
    const source = identify(src)

    const receiver = vertex.node.receivers.find(
      (receiver) => receiver.source === source && receiver.event === src.event,
    )

    if (receiver !== undefined) return `receiver:${receiver.label}`
  }

  return `operation:${call.dst.operation}`
}

/** Where a call leaves: the operation that made it, or the event that caused it. */
function departure(call: Edge): string | null {
  if ('event' in call.src) return `event:${call.src.event}`

  if ('operation' in call.src) return `operation:${call.src.operation}`

  return null
}

/** Callers from outside stand under the components, as they do on the map itself. */
function byVertex(a: Satellite, b: Satellite): number {
  if (a.vertex.kind !== b.vertex.kind) return a.vertex.kind === 'service' ? 1 : -1

  return a.vertex.id.localeCompare(b.vertex.id)
}
