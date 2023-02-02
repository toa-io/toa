'use strict'

const { console } = require('@toa.io/libraries/console')
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

    console.debug(`Sending lookup request to '${id}'`)

    const warning = () => console.warn(`Waiting for lookup response from '${id}'...`)
    const timeout = setTimeout(warning, TIMEOUT)

    const { output } = await this.#lookups[id].invoke()

    console.debug(`Lookup response from '${id}' received`)
    clearTimeout(timeout)

    return output
  }
}

const TIMEOUT = 5000

exports.Discovery = Discovery
