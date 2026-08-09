'use strict'

const { console, decode, run } = require('openspan')
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

  /** @type {string} */
  #label

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
    this.#label = definition.label ?? operation
    this.#arguments = definition.arguments

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    if (bridge !== undefined) this.depends(bridge)
  }

  /** @hot */
  async receive (message) {
    const { payload, telemetry, ...extensions } = message

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = await this.#request(payload)

    add(request, extensions)

    // continue the trace from the producer span
    const remote = telemetry === undefined ? null : decode(telemetry)
    const task = () => this.#process(request)

    if (remote === null)
      await task()
    else
      await run(remote, task)
  }

  async #process (request) {
    const options = {
      name: `${this.#label} process`,
      kind: 'consumer',
      service: this.#local.locator.id
    }

    return console.span(options, async () => {
      try {
        await this.#local.invoke(this.#endpoint, request)
      } catch (error) {
        console.error('Receiver error', {
          component: this.#local.locator.id,
          endpoint: this.#endpoint,
          error
        })

        throw error
      }
    })
  }

  async #request (payload) {
    return this.#adaptive ? await this.#bridge.request(payload, ...(this.#arguments ?? [])) : { input: payload }
  }
}

exports.Receiver = Receiver
