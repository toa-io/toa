'use strict'

const { Connector } = require('./connector')

class Cascade extends Connector {
  // #bridges
  #last

  constructor (bridges) {
    super()

    // this.#bridges = bridges
    this.#last = bridges[bridges.length - 1]

    this.depends(bridges)
  }

  async run (...args) {
    // const reply = {}
    //
    // for (const bridge of this.#bridges) {
    //   const partial = await bridge.execute(...args)
    //
    //   if (partial.error) return { error: partial.error }
    //
    //   merge(reply, partial)
    // }
    //
    // return reply

    return this.#last.execute(...args)
  }
}

exports.Cascade = Cascade
