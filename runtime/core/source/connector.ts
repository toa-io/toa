import { console } from 'openspan'
import { environment } from '@toa.io/generic'
import type { Locator } from './locator.js'

/** Abstract connections hierarchy */
export class Connector {
  #dependencies: Connector[] = []
  #links: Connector[] = []
  #connecting: Promise<void> | undefined
  #disconnecting: Promise<void> | undefined
  #discarded: boolean = false

  public readonly id: string
  public connected: boolean = false

  /**
   * Whether this has been taken down. What is disposed of is never connected again: a
   * communication it held is sealed, an announcement it made has stopped, an algorithm it ran
   * is unmounted. Whoever remembers one for the life of the process — an extension factory
   * caching what it hands to components — replaces it rather than handing it out twice.
   */
  public disposed: boolean = false

  public constructor() {
    this.id = this.constructor.name + '#' + Math.random().toString(36).substring(2, 8)
  }

  /**
   * Creates a dependency and backlink with another Connector or a set of Connectors
   *
   * See .connect() and .disconnect()
   *
   */
  public depends(connector: Connector | Connector[]): Connector {
    let next: Connector

    if (connector instanceof Array) {
      if (connector.length === 0) throw new Error('Connectors array must not be empty')

      if (connector.length > 1) {
        next = new Connector()

        for (const item of connector) {
          this.#dependencies.push(item)
          item.depends(next)
        }
      } else next = connector[0]
    } else next = connector

    this.#dependencies.push(next)
    next.link(this)

    // See .#discard()
    if (this.#disconnecting !== undefined) next.#discard()

    return next
  }

  /**
   * Disconnects, now and again if a connection is still to land.
   *
   * A dependency taken on after its dependant was disconnected — a lookup that returns
   * once the teardown walk has gone by — is one nothing is left to take down, as the
   * walk that would have reached it is over. One that stays connected holds open
   * everything it depends on with it: a dependency reads `connected` of every dependant
   * before it closes, and a dependant that is connected for good is a dependency that
   * never closes.
   */
  #discard(): void {
    this.#discarded = true

    // one that is up already, or on its way, is taken down here; one that is not is
    // taken down by the connection when it comes, and until then there is nothing to do
    if (this.#connecting !== undefined) void this.#drop()
  }

  /**
   * Creates a backlink to another Connector
   *
   * See .connect() and .disconnect()
   *
   */
  public link(connector: Connector): void {
    this.#links.push(connector)
  }

  /**
   * Connects dependants then self
   *
   * In case of exception disconnects with current connection interruption
   *
   * Method is idempotent
   *
   */
  public async connect(): Promise<void> {
    if (this.#connecting) return this.#connecting

    this.#disconnecting = undefined

    const work = async () => {
      await Promise.all(this.#dependencies.map((connector) => connector.connect()))
      await this.open()
    }

    // anonymous grouping nodes are not worth a span
    const connecting =
      TRACE_BOOT && this.constructor.name !== 'Connector'
        ? console.span(
            {
              name: `connect ${this.constructor.name}`,
              // a connector that has a locator is named by it; a grouping node has none
              attributes: { id: (this as { locator?: Locator }).locator?.id ?? this.id }
            },
            work
          )
        : work()

    this.#connecting = connecting

    try {
      await connecting

      /*
       * A disconnection that did not wait for this connection emptied `#connecting` to
       * say so. Reporting `connected` now would report it of a connector nothing takes
       * down again — its `#disconnecting` has settled, so a later call returns at once —
       * and what it depends on reads that of every dependant before it closes.
       */
      if (this.#connecting === connecting) this.connected = true
    } catch (e) {
      await this.disconnect(true)
      throw e
    }

    // a connection asked for before this one was discarded, landing after. See .#discard()
    if (this.#discarded) await this.#drop()
  }

  /** Disconnects a discarded connector, saying so rather than throwing at whoever is not waiting. */
  async #drop(): Promise<void> {
    this.#discarded = false

    try {
      await this.disconnect()
    } catch (error) {
      console.error('Discarded connector failed to disconnect', { id: this.id, error })
    }
  }

  /**
   * Disconnects self then dependants
   *
   * Does nothing if there are connected linked Connectors
   *
   * Method is idempotent
   *
   */
  public async disconnect(interrupt?: boolean): Promise<void> {
    // a connector that has not finished connecting has nothing to close, and
    // awaiting a connection that may never settle outlives any grace period
    const pending = interrupt === true || this.connected === false

    if (!pending) await this.#connecting

    if (this.#disconnecting) return this.#disconnecting

    const linked = this.#links.reduce((acc, parent) => acc || parent.connected, false)

    if (linked && interrupt !== true) return

    this.#disconnecting = (async () => {
      const start = +new Date()

      const interval = setInterval(() => {
        const delay = +new Date() - start

        if (delay > DELAY)
          console.warn(`Connector ${this.id} still disconnecting (${delay})`)
      }, DELAY)

      if (!pending) await this.close()

      // said once the closing is done rather than when it starts: a dependant that is
      // still closing is still using what it depends on, and the check above reads this
      // of every dependant. Saying it early lets the first to start tear down a shared
      // dependency under the others.
      this.connected = false
      this.#connecting = undefined

      clearInterval(interval)

      await Promise.all(this.#dependencies.map((connector) => connector.disconnect()))

      await this.dispose()

      this.disposed = true
    })()

    await this.#disconnecting
  }

  public async reconnect(): Promise<void> {
    await this.disconnect()
    await this.connect()
  }

  public debug(node: Record<string, any> = {}): Record<string, any> {
    node[this.id] = { connected: this.connected }

    if (this.#dependencies.length > 0)
      for (const connector of this.#dependencies) connector.debug?.(node[this.id])

    return node
  }

  /** Called on connection */
  protected open(): Promise<void> | void {}

  /** Called on disconnection */
  protected close(): Promise<void> | void {}

  /** Called after self and dependants disconnection is complete */
  protected dispose(): Promise<void> | void {}
}

const DELAY = 5000
const TRACE_BOOT = environment.get('TOA_BOOT_TRACE') === '1'
