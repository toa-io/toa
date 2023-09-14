'use strict'

const { Nope } = require('nopeable')
const { Connector } = require('@toa.io/core')

class Runner extends Connector {
  /** @type {toa.node.Algorithm} */
  #algorithm

  /** @type {toa.node.Context} */
  #context

  constructor (algorithm, context) {
    super()

    this.#algorithm = algorithm
    this.#context = context

    this.depends(context)
  }

  async open () {
    await this.#algorithm.mount?.(this.#context)
  }

  async execute (input, state) {
    const reply = await this.#algorithm.execute(input, state)

    if (reply instanceof Nope) return { error: reply }
    else if (reply === undefined) return undefined
    else return { output: reply }
  }
}

exports.Runner = Runner
