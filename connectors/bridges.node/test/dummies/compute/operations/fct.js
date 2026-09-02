import { Computation } from './cls.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
class ComputationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Computation()
  }
}

export { ComputationFactory }
