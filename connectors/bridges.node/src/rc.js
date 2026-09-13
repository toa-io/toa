import { Connector } from '@toa.io/core'

/**
 * A set of run commands sharing a lifecycle moment
 */
class Commands extends Connector {
  /** @type {Function[]} */
  #fns

  /** @type {toa.node.Context} */
  #context

  constructor(fns, context) {
    super()

    this.#fns = fns
    this.#context = context

    this.depends(context)
  }

  async run() {
    await Promise.all(this.#fns.map((fn) => fn(this.#context)))
  }
}

/**
 * A startup phase: `preflight`, `settle` and `ready`
 */
export class Phase extends Commands {
  async open() {
    await this.run()
  }
}

/**
 * The teardown counterpart of a startup phase: what a component opened in `preflight`
 * is released here. It runs on disconnection, before the context it depends on is
 * disconnected, so the component can still reach its remotes while releasing.
 */
export class Teardown extends Commands {
  async close() {
    await this.run()
  }
}

/**
 * What a component stops while the process is halted, and starts again when it is not. Not a
 * lifecycle moment like the phases above: the component is whole throughout, and this is what
 * it does about the process going quiet.
 */
export class Quiescence extends Connector {
  /** @type {Function[]} */
  #stopping

  /** @type {Function[]} */
  #resuming

  /** @type {toa.node.Context} */
  #context

  constructor(stopping, resuming, context) {
    super()

    this.#stopping = stopping
    this.#resuming = resuming
    this.#context = context

    this.depends(context)
  }

  async stop() {
    await Promise.all(this.#stopping.map((fn) => fn(this.#context)))
  }

  async resume() {
    await Promise.all(this.#resuming.map((fn) => fn(this.#context)))
  }
}
