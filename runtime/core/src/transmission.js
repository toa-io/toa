'use strict'

const { Connector } = require('./connector')
const { TransmissionException } = require('./exceptions')

class Transmission extends Connector {
  #bindings

  constructor (bindings) {
    super()

    this.#bindings = bindings
    this.depends(bindings)
  }

  async request (request) {
    let reply = false
    let i = 0

    while (reply === false && i < this.#bindings.length) {
      const binding = this.#bindings[i]

      i++

      if (request.task === true) {
        if (binding.task === undefined)
          continue

        await binding.task(request)
        reply = null
      } else
        reply = await binding.request(request)
    }

    if (reply === false)
      throw new TransmissionException(`All (${this.#bindings.length}) bindings rejected.`)

    return reply
  }
}

exports.Transmission = Transmission
