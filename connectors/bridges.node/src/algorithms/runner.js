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

    if (typeof reply === 'object') {
      const output = reply.output !== undefined
      const error = reply.error !== undefined

      if (!output && !error) reply = { output: reply }
    }

    return reply
  }
}

exports.Runner = Runner
