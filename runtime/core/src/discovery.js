'use strict'

const { console } = require('openspan')
const { Connector } = require('./connector')

class Discovery extends Connector {
  #lookup
  #lookups

  constructor (lookup) {
    super()

    this.#lookup = lookup
  }

  async open () {
    this.#lookups = {}
  }

  async lookup (locator) {
    const id = locator.id

    if (this.#lookups[id] === undefined) {
      this.#lookups[id] = await this.#lookup(locator)
      this.depends(this.#lookups[id])
    }

    const since = Date.now()

    // the wait is unbounded by design, as a dependency may still be starting,
    // so repeating is the only way a component stuck on one stays visible
    const warning = setInterval(() => {
      const waiting = Math.round((Date.now() - since) / 1000)

      console.warn('Waiting for lookup response', { component: id, waiting })
    }, INTERVAL)

    warning.unref()

    const output = await this.#lookups[id].invoke()

    clearInterval(warning)

    return output
  }
}

const INTERVAL = 5000

exports.Discovery = Discovery
