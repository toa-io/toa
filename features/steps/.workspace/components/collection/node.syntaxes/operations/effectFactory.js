import { Effect } from './effectClass.js'

export class EffectFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  async create () {
    return new Effect()
  }
}
