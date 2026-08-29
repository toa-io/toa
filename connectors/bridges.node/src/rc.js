'use strict'

const { Connector } = require('@toa.io/core')

/**
 * A set of run commands sharing a lifecycle moment
 */
class Commands extends Connector {
  /** @type {Function[]} */
  #fns

  /** @type {toa.node.Context} */
  #context

  constructor (fns, context) {
    super()

    this.#fns = fns
    this.#context = context

    this.depends(context)
  }

  async run () {
    await Promise.all(this.#fns.map((fn) => fn(this.#context)))
  }
}

/**
 * A startup phase: `preflight` and `settle`
 */
class Phase extends Commands {
  async open () {
    await this.run()
  }
}

/**
 * The teardown counterpart of a startup phase: what a component opened in `preflight`
 * is released here. It runs on disconnection, before the context it depends on is
 * disconnected, so the component can still reach its remotes while releasing.
 */
class Teardown extends Commands {
  async close () {
    await this.run()
  }
}

exports.Phase = Phase
exports.Teardown = Teardown
