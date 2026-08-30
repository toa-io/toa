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

  /** @type {string} */
  #destination

  /** @type {unknown[]} */
  #arguments

  /** @type {toa.core.Source} */
  #origin

  #local

  #bridge

  /** @type {object} */
  #delivery

  /** @type {object} */
  #processing

  constructor (definition, local, bridge) {
    super()

    const { conditioned, adaptive, operation } = definition

    this.#conditioned = conditioned
    this.#adaptive = adaptive
    this.#endpoint = operation
    this.#label = definition.label ?? operation
    this.#destination = definition.destination ?? this.#label
    this.#arguments = definition.arguments
    this.#origin = definition.origin

    this.#local = local
    this.#bridge = bridge

    this.depends(local)
    if (bridge !== undefined) this.depends(bridge)

    /*
     * The delivery span is created on behalf of the messaging destination, so that
     * each consumer forms its own complete producer/consumer pair, and service graphs
     * display fan-out correctly: producer -> destination -> each consumer
     * (Tempo pairs spans one-to-one, thus multiple consumers can not pair
     * with a single producer span, see grafana/tempo#5408)
     */
    this.#delivery = {
      name: `${this.#label} deliver`,
      kind: 'producer',
      service: this.#destination,
      attributes: { 'messaging.destination.name': this.#destination }
    }

    this.#processing = {
      name: `${this.#label} process`,
      kind: 'consumer',
      service: local.locator.id,
      attributes: { 'messaging.destination.name': this.#destination }
    }
  }

  /** @hot */
  async receive (message) {
    const { payload, telemetry, ...extensions } = message

    if (this.#conditioned && await this.#bridge.condition(payload) === false) return

    const request = await this.#request(payload)

    add(request, extensions)

    // set after `add`, so that a message field can not spoof the origin
    if (this.#origin !== undefined) request.source = this.#origin

    // continue the trace from the producer span
    const remote = telemetry === undefined ? null : decode(telemetry)
    const task = () => this.#process(request)

    if (remote === null)
      await task()
    else
      await run(remote, task)
  }

  async #process (request) {
    return console.span(this.#delivery, async () => console.span(this.#processing, async () => {
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
    }))
  }

  async #request (payload) {
    return this.#adaptive ? await this.#bridge.request(payload, ...(this.#arguments ?? [])) : { input: payload }
  }
}

exports.Receiver = Receiver
