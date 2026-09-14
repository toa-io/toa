import { console } from 'openspan'
import { Connector } from './connector.ts'
import type { Locator } from './locator.ts'

interface Lookup extends Connector {
  invoke: () => Promise<any>
}

export class Discovery extends Connector {
  readonly #lookup: (locator: Locator, version?: string) => Promise<Lookup>
  #lookups: Record<string, Promise<Lookup>> = {}

  /** What is still saying it is waiting, so that a discovery going away can stop it. */
  readonly #waiting = new Set<NodeJS.Timeout>()

  public constructor(lookup: (locator: Locator, version?: string) => Promise<Lookup>) {
    super()

    this.#lookup = lookup
  }

  protected override async open(): Promise<void> {
    this.#lookups = {}
  }

  /**
   * A lookup is unbounded, so one in flight when this goes away never settles and would go on
   * saying it is waiting for the life of the process. Which nothing noticed while a
   * disconnected discovery meant a process on its way out — a halt takes one down and builds
   * another, and every cycle would leave a voice behind.
   */
  protected override async close(): Promise<void> {
    for (const warning of this.#waiting) clearInterval(warning)

    this.#waiting.clear()
  }

  /**
   * @param locator the component asked
   * @param version which of its versions answers; absent, whichever of them takes the message
   */
  public async lookup(locator: Locator, version?: string): Promise<any> {
    const id = locator.id

    // one per version: two of them answer under names of their own, and a process that has
    // asked one may go on to ask the other
    const key = version === undefined ? id : id + ':' + version

    if (this.#lookups[key] === undefined) {
      const lookup = await this.#lookup(locator, version)

      this.#lookups[key] = Promise.resolve(lookup)
      this.depends(lookup)
    }

    const since = Date.now()

    // a lookup with no version is one made outside a deployment, and saying so every five
    // seconds would say nothing
    const asked: Record<string, string> =
      version === undefined ? { component: id } : { component: id, version }

    // the wait is unbounded by design, as a dependency may still be starting,
    // so repeating is the only way a component stuck on one stays visible
    const warning = setInterval(() => {
      const waiting = Math.round((Date.now() - since) / 1000)

      console.warn('Waiting for lookup response', { ...asked, waiting })
    }, INTERVAL)

    warning.unref()
    this.#waiting.add(warning)

    try {
      return await (await this.#lookups[key]).invoke()
    } finally {
      clearInterval(warning)
      this.#waiting.delete(warning)
    }
  }
}

const INTERVAL = 5000
