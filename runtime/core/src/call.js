'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Call extends Connector {
  #transmitter
  #contract

  constructor (transmitter, contract) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract

    this.depends(transmitter)
  }

  async invoke (request) {
    if (request) this.#contract.fit(request)

    const { exception, ...reply } = await this.#transmitter.request(request)

    if (exception) throw new Exception(exception)

    return reply
  }
}

exports.Call = Call
