'use strict'

const { Connector } = require('@toa.io/core')

class RC extends Connector {
  /** @type {Function[]} */
  #rcs

  /** @type {toa.node.Context} */
  #context

  constructor (rcs, context) {
    super()

    this.#rcs = rcs
    this.#context = context

    this.depends(context)
  }

  async open () {
    await Promise.all(this.#rcs.map((rc) => rc(this.#context)))
  }
}

exports.RC = RC
