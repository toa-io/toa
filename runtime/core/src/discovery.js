'use strict'

const { Connector } = require('./connector')

class Discovery extends Connector {
  #create
  #lookups = {}

  constructor (create) {
    super()

    this.#create = create
  }

  async lookup (id) {
    if (this.#lookups[id] === undefined) {
      this.#lookups[id] = await this.#create(id)
      this.depends(this.#lookups[id])
    }

    const reply = await this.#lookups[id].invoke()

    return reply.output
  }
}

exports.Discovery = Discovery
