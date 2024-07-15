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

    const warning = () => console.warn(`Waiting for lookup response from %s...`, id)
    const timeout = setTimeout(warning, TIMEOUT)

    const output = await this.#lookups[id].invoke()

    clearTimeout(timeout)

    return output
  }
}

const TIMEOUT = 5000

exports.Discovery = Discovery
