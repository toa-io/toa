import { console } from 'openspan'
import { Connector } from './connector.js'
import type { Locator } from './locator.js'

interface Lookup extends Connector {
  invoke: () => Promise<any>
}

export class Discovery extends Connector {
  readonly #lookup: (locator: Locator) => Promise<Lookup>
  #lookups: Record<string, Promise<Lookup>> = {}

  public constructor (lookup: (locator: Locator) => Promise<Lookup>) {
    super()

    this.#lookup = lookup
  }

  protected override async open (): Promise<void> {
    this.#lookups = {}
  }

  public async lookup (locator: Locator): Promise<any> {
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

    const output = await (await this.#lookups[id]).invoke()

    clearInterval(warning)

    return output
  }
}

const INTERVAL = 5000
