import { overwrite } from '@toa.io/generic'

import { Connector } from '@toa.io/core'

/**
 * @implements {import('@toa.io/core/types').extensions.Aspect}
 */
export class Aspect extends Connector {
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
