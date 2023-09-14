'use strict'

const { Transition } = require('./transitionClass')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ObjectTransitionFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Transition()
  }
}

exports.ObjectTransitionFactory = ObjectTransitionFactory
