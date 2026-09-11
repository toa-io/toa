import { console } from 'openspan'
import { Connector } from './connector.ts'
import type { Locator } from './locator.ts'

interface Lookup extends Connector {
  invoke: () => Promise<any>
}

export class Discovery extends Connector {
  readonly #lookup: (locator: Locator) => Promise<Lookup>
  #lookups: Record<string, Promise<Lookup>> = {}

  /** What is still saying it is waiting, so that a discovery going away can stop it. */
  readonly #waiting = new Set<NodeJS.Timeout>()

  public constructor(lookup: (locator: Locator) => Promise<Lookup>) {
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

  public async lookup(locator: Locator): Promise<any> {
    const id = locator.id

    if (this.#lookups[id] === undefined) {
      const lookup = await this.#lookup(locator)

      this.#lookups[id] = Promise.resolve(lookup)
      this.depends(lookup)
    }

    const since = Date.now()

    // the wait is unbounded by design, as a dependency may still be starting,
    // so repeating is the only way a component stuck on one stays visible
    const warning = setInterval(() => {
      const waiting = Math.round((Date.now() - since) / 1000)

      console.warn('Waiting for lookup response', { component: id, waiting })
    }, INTERVAL)

    warning.unref()
    this.#waiting.add(warning)

    try {
      return await (await this.#lookups[id]).invoke()
    } finally {
      clearInterval(warning)
      this.#waiting.delete(warning)
    }
  }
}

const INTERVAL = 5000
