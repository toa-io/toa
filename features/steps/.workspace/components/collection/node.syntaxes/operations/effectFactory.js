import { Effect } from './effectClass.js'

class EffectFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  async create () {
    return new Effect()
  }
}

export { EffectFactory }
