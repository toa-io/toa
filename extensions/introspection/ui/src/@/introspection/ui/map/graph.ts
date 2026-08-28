import { identify } from '../ui'

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
}

export interface Graph {
  vertices: Vertex[]
  links: Link[]
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

    if (link === undefined) links.set(`${from} ${to}`, { id: `${from} ${to}`, from, to, calls: 1 })
    else link.calls++
  }

  return { vertices: [...services.values(), ...components], links: [...links.values()] }
}

function origin(src: Edge['src']): string {
  return 'service' in src ? `svc:${src.service}` : identify(src)
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
