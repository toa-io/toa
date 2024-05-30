'use strict'

const { Readable } = require('node:stream')
const { Connector } = require('@toa.io/core')
const { match } = require('matchacho')

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

    return match(reply,
      Error, (error) => ({ error }),
      Readable, reply,
      isGenerator, (generator) => Readable.from(generator),
      (output) => ({ output })
    )
  }
}

function isGenerator (object) {
  const constructor = object?.constructor?.[Symbol.toStringTag]

  return constructor !== undefined &&
    (constructor === 'AsyncGeneratorFunction' ||
      constructor === 'GeneratorFunction')
}

exports.Runner = Runner
