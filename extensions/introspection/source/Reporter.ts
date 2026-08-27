import { Connector, Locator } from '@toa.io/core'
import { console } from 'openspan'
import { EDGES, MAX_EDGES, MERGE, NAMESPACE, NODES, TRANSIT } from './const'
import * as keys from './keys'
import type { Bootloader } from './Factory'
import type { Options } from './annotation'
import type { Edge, Node } from './model'
import type { Remote } from '@toa.io/core'

/**
 * Buffers what a process observes and flushes it into the introspection
 * components. Nothing here is awaited on the request path: the map is lossy
 * by nature and must never become backpressure on the application.
 */
export class Reporter extends Connector {
  private readonly boot: Bootloader
  private readonly options: Options
  private readonly nodes = new Map<string, Node>()
  private readonly edges = new Map<string, Edge>()
  private readonly remotes: Record<string, Promise<Remote>> = {}

  private timer: NodeJS.Timeout | null = null
  private flushing: Promise<void> | null = null
  private dropped = 0

  public constructor (boot: Bootloader, options: Options) {
    super()

    this.boot = boot
    this.options = options
  }

  /** The static description of a component. */
  public expose (node: Node): void {
    this.nodes.set(keys.node(node.namespace, node.component), node)

    void this.flush()
  }

  /** A connection between two components. */
  public observe (observed: Edge): void {
    const id = keys.edge(observed.kind, observed.src, observed.dst)
    const edge = this.edges.get(id)

    if (edge === undefined) {
      /*
       * `source` arrives over the wire, so the number of distinct edges a process
       * can hold has to be bounded regardless of what peers send.
       */
      if (this.edges.size >= MAX_EDGES) {
        this.dropped++

        return
      }

      this.edges.set(id, observed)
    } else if (observed.sample !== undefined)
      edge.sample = observed.sample

    if (this.edges.size >= this.options.threshold)
      void this.flush()
  }

  protected override async open (): Promise<void> {
    this.timer = setInterval(() => void this.flush(), this.options.interval * 1000)
    this.timer.unref()
  }

  protected override async close (): Promise<void> {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }

    await this.flushing

    // the remotes are still up: dependencies are disconnected after this returns
    await this.dispatch().catch((error: Error) => {
      console.debug('Introspection final flush failed', { message: error.message })
    })
  }

  private async flush (): Promise<void> {
    // a dispatch in flight keeps observations buffered, they join the next batch
    if (this.flushing !== null)
      return

    if (this.nodes.size === 0 && this.edges.size === 0)
      return

    this.flushing = this.dispatch()
      .catch((error: Error) => {
        console.debug('Introspection flush failed', { message: error.message })
      })
      .finally(() => {
        this.flushing = null
      })

    await this.flushing
  }

  private async dispatch (): Promise<void> {
    const nodes = [...this.nodes.values()]
    const edges = [...this.edges.entries()]

    this.nodes.clear()
    this.edges.clear()

    if (this.dropped > 0) {
      console.warn('Introspection edges dropped', { dropped: this.dropped, limit: MAX_EDGES })
      this.dropped = 0
    }

    await Promise.all([this.report(nodes), this.merge(edges)])
  }

  private async report (nodes: Node[]): Promise<void> {
    if (nodes.length === 0)
      return

    const remote = await this.remote(NODES)

    await Promise.all(nodes.map(async (node) =>
      await remote.invoke(TRANSIT, {
        query: { id: keys.node(node.namespace, node.component) },
        input: node,
        task: true
      })))
  }

  private async merge (observed: Array<[string, Edge]>): Promise<void> {
    if (observed.length === 0)
      return

    const remote = await this.remote(EDGES)
    const edges: Record<string, Edge> = {}

    for (const [id, edge] of observed)
      edges[id] = edge

    // a mass transition: every affected edge is acquired and committed at once
    await remote.invoke(MERGE, {
      query: { ids: observed.map(([id]) => id) },
      input: { edges },
      task: true
    })
  }

  private async remote (name: string): Promise<Remote> {
    this.remotes[name] ??= this.discover(name)

    return await this.remotes[name]
  }

  private async discover (name: string): Promise<Remote> {
    const remote = await this.boot.remote(new Locator(name, NAMESPACE))

    this.depends(remote)

    await remote.connect()

    return remote
  }
}
