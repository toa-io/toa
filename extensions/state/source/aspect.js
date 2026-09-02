import { overwrite } from '@toa.io/generic'

import { Connector } from '@toa.io/core'

/**
 * @implements {toa.core.extensions.Aspect}
 */
class Aspect extends Connector {
  name = 'state'

  /** @type {object} */
  #value = {}

  /**
   * @param {object} value
   */
  invoke (value) {
    if (value === undefined) return this.#value
    else this.#set(value)
  }

  #set (value) {
    overwrite(this.#value, value)
  }
}

export { Aspect }
