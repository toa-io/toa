'use strict'

const { console, current, encode } = require('openspan')
const { Connector } = require('./connector')

/**
 * @implements {toa.core.Event}
 */
class Event extends Connector {
  /** @type {toa.core.bindings.Emitter} */
  #emitter
  #bridge
  #conditioned
  #subjective

  /** @type {string} */
  #label

  constructor (definition, emitter, bridge = undefined) {
    super()

    this.#conditioned = definition.conditioned
    this.#subjective = definition.subjective
    this.#label = definition.label ?? 'event'
    this.#emitter = emitter
    this.#bridge = bridge

    this.depends(emitter)

    if (bridge !== undefined) this.depends(bridge)
  }

  async emit (event) {
    if (this.#conditioned === false || await this.#bridge.condition(event) === true) {
      const payload = this.#subjective ? await this.#bridge.payload(event) : event.state

      /** @type {toa.core.Message} */
      const message = { payload }

      const options = {
        name: `${this.#label} publish`,
        kind: 'producer',
        attributes: { 'messaging.destination.name': this.#label }
      }

      await console.span(options, async () => {
        const context = current()

        if (context !== undefined)
          message.telemetry = encode(context)

        await this.#emitter.emit(message)
      })
    }
  }
}

exports.Event = Event
