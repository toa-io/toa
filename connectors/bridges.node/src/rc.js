'use strict'

const { Connector } = require('@toa.io/core')

class Phase extends Connector {
  /** @type {Function[]} */
  #fns

  /** @type {toa.node.Context} */
  #context

  constructor (fns, context) {
    super()

    this.#fns = fns
    this.#context = context

    this.depends(context)
  }

  async open () {
    await Promise.all(this.#fns.map((fn) => fn(this.#context)))
  }
}

exports.Phase = Phase
