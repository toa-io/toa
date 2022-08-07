'use strict'

const { Transition } = require('./o-cls')

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
