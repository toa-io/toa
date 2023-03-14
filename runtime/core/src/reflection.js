'use strict'

const { Connector } = require('./connector')

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

exports.Reflection = Reflection
