import { Observation } from './observationClass.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
export class ObjectObservationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Observation()
  }
}
