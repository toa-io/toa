'use strict'

/**
 * @implements {toa.node.Algorithm}
 */
class Func {
  /** @type {toa.node.algorithms.func} */
  #func

  /** @type {toa.node.Context} */
  #context

  /**
   * @param {toa.node.algorithms.func} func
   */
  constructor (func) {
    this.#func = func
  }

  execute (input, state) {
    return this.#func(input, state, this.#context)
  }

  mount (context) {
    this.#context = context
  }
}

/** @type {toa.node.define.algorithms.Constructor} */
const create = (func) => new Func(func)

exports.create = create
