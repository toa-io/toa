'use strict'

const { Connector } = require('./connector')

class Call extends Connector {
  #transmitter
  #contract

  constructor (transmitter, contract) {
    super()

    this.#transmitter = transmitter
    this.#contract = contract

    this.depends(transmitter)
  }

  async invoke (request = {}) {
    this.#contract.fit(request)

    const { exception, ...reply } = await this.#transmitter.request(request)

    if (exception) throw exception

    return reply
  }
}

exports.Call = Call
