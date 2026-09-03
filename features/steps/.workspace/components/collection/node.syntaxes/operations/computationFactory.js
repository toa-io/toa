import { Computation } from './computationClass.js'

/**
 * @implements {toa.node.algorithms.Factory}
 */
export class ComputationFactory {
  #context

  constructor (context) {
    this.#context = context
  }

  create () {
    return new Computation()
  }
}
