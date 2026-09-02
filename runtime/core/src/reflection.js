import { Connector } from './connector.js'

/**
 * @implements {toa.core.Reflection}
 */
class Reflection extends Connector {
  /** @type {toa.core.reflection.Source} */
  #source

  value

  /**
   * @param {toa.core.reflection.Source} source
   */
  constructor (source) {
    super()

    this.#source = source
  }

  async open () {
    this.value = await this.#source()
  }
}

export { Reflection }
