'use strict'

const { Nope } = require('nopeable')
const { Connector } = require('@toa.io/core')
const { Readable } = require('node:stream')

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
    else if (isGenerator(reply)) return Readable.from(reply)
    else if (reply instanceof Readable) return reply
    else return { output: reply }
  }
}

function isGenerator (object) {
  const constructor = object?.constructor?.[Symbol.toStringTag]

  return constructor !== undefined &&
    (constructor === 'AsyncGeneratorFunction' ||
      constructor === 'GeneratorFunction')
}

exports.Runner = Runner
