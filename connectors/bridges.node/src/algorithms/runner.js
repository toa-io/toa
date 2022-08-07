'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Runner extends Connector {
  /** @type {toa.core.bridges.Algorithm} */
  #instance

  /**
   * @param {toa.core.bridges.Algorithm} instance
   * @param {toa.node.Context} context
   */
  constructor (instance, context) {
    super()

    this.#instance = instance

    this.depends(context)
  }

  async run (input, state) {
    let reply = await this.#instance.run(input, state)

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
