'use strict'

const { Connector } = require('./connector')

class Discovery extends Connector {
  #lookup
  #lookups

  constructor (lookup) {
    super()

    this.#lookup = lookup
  }

  async connection () {
    this.#lookups = {}
  }

  async lookup (locator) {
    const id = locator.id

    if (this.#lookups[id] === undefined) {
      this.#lookups[id] = await this.#lookup(locator)
      this.depends(this.#lookups[id])
    }

    const { output } = await this.#lookups[id].invoke()

    return output
  }
}

exports.Discovery = Discovery
