'use strict'

const { Effect } = require('./effectClass')

/**
 * @implements {toa.node.algorithms.Factory}
 */
class EffectFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Effect()
  }
}

exports.EffectFactory = EffectFactory
