import { Observation } from './observationClass.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ObjectObservationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Observation()
  }
}

export { ObjectObservationFactory }
