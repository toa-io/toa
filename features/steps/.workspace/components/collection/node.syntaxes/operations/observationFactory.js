'use strict'

const { Observation } = require('./observationClass')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ObjectObservationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Observation()
  }
}

exports.ObjectObservationFactory = ObjectObservationFactory
