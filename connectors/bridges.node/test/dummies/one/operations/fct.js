import { Transition } from './cls.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
export class ObjectTransitionFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Transition(this.#context)
  }
}
