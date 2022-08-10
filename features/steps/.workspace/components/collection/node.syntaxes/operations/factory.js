'use strict'

const { Transition } = require('./class')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ObjectTransitionFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Transition(this.#context)
  }
}

exports.ObjectTransitionFactory = ObjectTransitionFactory
