import { Connector, Locator } from '@toa.io/core'
import { console } from 'openspan'
import { EDGES, MAX_EDGES, NAMESPACE, NODES } from './const'
import * as keys from './keys'
import type { Bootloader } from './Factory'
import type { Options } from './annotation'
import type { Edge, Node } from './model'
import type { Remote } from '@toa.io/core'

/**
 * Buffers what a process observes and flushes it into the introspection
 * components.
 *
 * Nothing here is on the critical path. Reaching the explorer is a discovery,
 * which waits as long as it takes, so the collector never holds up a component
 * starting, running or stopping: it buffers until the connection is there, and
 * when it has to choose it gives up on the data rather than on the application.
 */
export class Reporter extends Connector {
  private readonly boot: Bootloader
  private readonly options: Options
  private readonly nodes = new Map<string, Node>()
  private readonly edges = new Map<string, Edge>()

  /** Holds a remote only once it is connected and usable. */
  private readonly remotes: Record<string, Remote> = {}

  private timer: NodeJS.Timeout | null = null
  private flushing: Promise<void> | null = null
  private acquiring = false
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

  /** A call between two components. */
  public observe (observed: Edge): void {
    const id = keys.edge(observed.src, observed.dst)
    const edge = this.edges.get(id)

    if (edge === undefined) {
      /*
       * `source` arrives over the wire, so the number of distinct edges a process
       * can hold has to be bounded regardless of what peers send — and of whether
       * anyone is there to take them.
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
    // deliberately not awaited: the explorer may not be there yet, or at all
    this.acquire()

    this.timer = setInterval(() => void this.flush(), this.options.interval * 1000)
    this.timer.unref()
  }

  protected override async close (): Promise<void> {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }

    await this.flushing

    if (!this.ready()) {
      this.discard('the explorer was never reached')

      return
    }

    // the remotes are still up: dependencies are disconnected after this returns
    await this.dispatch().catch((error: Error) => {
      console.debug('Introspection final flush failed', { message: error.message })
    })
  }

  private ready (): boolean {
    return NODES in this.remotes && EDGES in this.remotes
  }

  private async flush (): Promise<void> {
    // a dispatch in flight keeps observations buffered, they join the next batch
    if (this.flushing !== null)
      return

    if (this.nodes.size === 0 && this.edges.size === 0)
      return

    if (!this.ready()) {
      this.acquire()

      if (this.edges.size >= MAX_EDGES)
        this.discard('the explorer is not reachable')

      return
    }

    this.flushing = this.dispatch()
      .catch((error: Error) => {
        console.debug('Introspection flush failed', { message: error.message })
      })
      .finally(() => {
        this.flushing = null
      })

    await this.flushing
  }

  private discard (reason: string): void {
    const nodes = this.nodes.size
    const edges = this.edges.size + this.dropped

    this.nodes.clear()
    this.edges.clear()
    this.dropped = 0

    if (nodes === 0 && edges === 0)
      return

    console.warn(`Introspection data discarded, ${reason}`, { nodes, edges })
  }

  private async dispatch (): Promise<void> {
    const nodes = [...this.nodes.entries()]
    const edges = [...this.edges.entries()]

    this.nodes.clear()
    this.edges.clear()

    if (this.dropped > 0) {
      console.warn('Introspection edges dropped', { dropped: this.dropped, limit: MAX_EDGES })
      this.dropped = 0
    }

    await Promise.all([
      this.merge(NODES, 'nodes', nodes),
      this.merge(EDGES, 'edges', edges)
    ])
  }

  /**
   * A mass transition: every affected object is acquired and committed at once,
   * so a flush is one call per component whatever it carries.
   */
  private async merge (name: string, property: string,
    observed: Array<[string, Node | Edge]>): Promise<void> {
    if (observed.length === 0)
      return

    const objects: Record<string, Node | Edge> = {}

    for (const [id, object] of observed)
      objects[id] = object

    await this.remotes[name].invoke('merge', {
      query: { ids: observed.map(([id]) => id) },
      input: { [property]: objects },
      task: true
    })
  }

  /** Runs in the background: discovery waits for the explorer as long as it takes. */
  private acquire (): void {
    if (this.acquiring)
      return

    this.acquiring = true

    void this.reach().catch((error: Error) => {
      this.acquiring = false

      console.error('Introspection cannot reach its explorer', { message: error.message })
    })
  }

  private async reach (): Promise<void> {
    await Promise.all([NODES, EDGES].map(async (name) => {
      const remote = await this.boot.remote(new Locator(name, NAMESPACE))

      this.depends(remote)

      await remote.connect()

      this.remotes[name] = remote
    }))
  }
}
