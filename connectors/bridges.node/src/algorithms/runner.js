'use strict'

const { Readable } = require('node:stream')
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

  async close () {
    await this.#algorithm.unmount?.()
  }

  async execute (input, state) {
    const reply = await this.#algorithm.execute(input, state)

    if (reply instanceof Error)
      return { error: reply }

    if (reply instanceof Readable)
      return reply

    if (isGenerator(reply))
      return Readable.from(reply)

    return { output: reply }
  }
}

function isGenerator (object) {
  const constructor = object?.constructor?.[Symbol.toStringTag]

  return constructor !== undefined &&
    (constructor === 'AsyncGeneratorFunction' ||
      constructor === 'GeneratorFunction')
}

exports.Runner = Runner
