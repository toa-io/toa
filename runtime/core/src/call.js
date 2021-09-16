'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./contract')

class Call extends Connector {
  #transmission
  #contract

  constructor (transmission, contract) {
    super()

    this.#transmission = transmission
    this.#contract = contract

    this.depends(transmission)
  }

  async invoke (request) {
    if (request) this.#contract.fit(request)

    const { exception, ...reply } = await this.#transmission.request(request)

    if (exception) throw new Exception(exception)

    return reply
  }
}

exports.Call = Call
