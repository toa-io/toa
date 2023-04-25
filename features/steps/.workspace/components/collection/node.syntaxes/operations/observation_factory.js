'use strict'

const { Observation } = require('./observation_class')

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
