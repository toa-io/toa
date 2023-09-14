'use strict'

const { Computation } = require('./computationClass')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ComputationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Computation()
  }
}

exports.ComputationFactory = ComputationFactory
