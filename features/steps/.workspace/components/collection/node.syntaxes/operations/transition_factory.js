'use strict'

const { Transition } = require('./transition_class')

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
