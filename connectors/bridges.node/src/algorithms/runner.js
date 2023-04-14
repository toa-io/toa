'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Runner extends Connector {
  /** @type {toa.node.algorithms.Constructor} */
  #ctor

  /** @type {toa.core.bridges.Algorithm} */
  #instance

  /**
   * @param {toa.node.algorithms.Constructor} ctor
   * @param {toa.node.Context} context
   */
  constructor (ctor, context) {
    super()

    this.#ctor = ctor

    this.depends(context)
  }

  async open () {
    this.#instance = /** @type {toa.core.bridges.Algorithm} */ this.#ctor()
  }

  async run (input, state) {
    let reply = await this.#instance.execute(input, state)

    if (reply !== undefined) reply = normalize(reply)

    return reply
  }
}

function normalize (reply) {
  const object = typeof reply === 'object'
  const output = object && reply.output !== undefined
  const error = object && reply.error !== undefined

  if (!output && !error) reply = { output: reply }

  return reply
}

exports.Runner = Runner
