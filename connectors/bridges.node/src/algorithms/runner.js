'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.bridges.Algorithm}
 */
class Runner extends Connector {
  /** @type {toa.node.Algorithm} */
  #algorithm

  /** @type {toa.node.Context} */
  #context

  /**
   * @param {toa.node.Algorithm} algorithm
   * @param {toa.node.Context} context
   */
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
    let reply = await this.#algorithm.execute(input, state)

    if (reply !== undefined) reply = normalize(reply)
    else reply = {}

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
