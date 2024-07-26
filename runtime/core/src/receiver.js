'use strict'

const { console } = require('openspan')
const { add } = require('@toa.io/generic')
const { Connector } = require('./connector')

/**
 * @implements {toa.core.Receiver}
 */
class Receiver extends Connector {
  /** @type {boolean} */
  #conditioned

  /** @type {boolean} */
  #adaptive

  /** @type {string} */
  #endpoint

  /** @type {unknown[]} */
  #arguments

  #local

  #bridge

  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, operation } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#endpoint = operation
    this.#arguments = definition.arguments

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    if (bridge !== undefined) this.depends(bridge)
  }

  /** @hot */
  async receive (message) {
    const { payload, ...extensions } = message

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = await this.#request(payload)

    add(request, extensions)

    try {
      await this.#local.invoke(this.#endpoint, request)
    } catch (error) {
      console.error('Receiver error', error)

      throw error
    }
  }

  async #request (payload) {
    return this.#adaptive ? await this.#bridge.request(payload, ...(this.#arguments ?? [])) : { input: payload }
  }
}

exports.Receiver = Receiver
