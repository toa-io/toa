'use strict'

const { Effect } = require('./effectClass')

class EffectFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  async create () {
    return new Effect()
  }
}

exports.EffectFactory = EffectFactory
