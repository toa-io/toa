'use strict'

const { merge } = require('@toa.io/libraries.generic')
const { Connector } = require('./connector')

class Cascade extends Connector {
  #bridges

  constructor (bridges) {
    super()

    this.#bridges = bridges

    this.depends(bridges)
  }

  async run (...args) {
    const reply = {}

    for (const bridge of this.#bridges) {
      const partial = await bridge.run(...args)

      if (partial.error) return { error: partial.error }

      merge(reply, partial)
    }

    return reply
  }
}

exports.Cascade = Cascade
