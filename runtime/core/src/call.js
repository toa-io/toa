'use strict'

const { Readable } = require('node:stream')
const { current, encode } = require('openspan')
const { Connector } = require('./connector')
const { Err } = require('error-value')

class Call extends Connector {
  #transmitter
  #contract
  #source

  constructor (transmitter, contract, source) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract
    this.#source = source

    this.depends(transmitter)
  }

  async invoke (request = {}) {
    // the caller may have attributed the call itself, as the node bridge does
    if (this.#source !== undefined)
      request.source ??= this.#source

    // fitting first lets the input schema supply its default;
    // an operation that takes no input still has to send an explicit null
    this.#contract.fit(request)

    request.input ??= null

    // avoid validation on the recipient's side
    request.authentic = true

    const context = current()

    if (context !== undefined)
      request.telemetry = encode(context)

    const reply = await this.#transmitter.request(request)

    if (reply === null) return null
    else if (reply instanceof Readable) return reply
    else {
      if (reply.exception !== undefined)
        throw reply.exception

      if (reply.error !== undefined)
        return Err(reply.error.code, reply.error)
      else
        return reply.output
    }
  }

  explain () {
    return this.#contract.discovery
  }
}

exports.Call = Call
