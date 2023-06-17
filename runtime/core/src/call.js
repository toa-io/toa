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

  /**
   * @param {toa.core.Request} request
   */
  async invoke (request = {}) {
    this.#contract.fit(request)

    request.authentic = true

    const reply = await this.#transmitter.request(request)

    if (reply === null) return null
    else {
      const { exception, ...rest } = reply

      if (exception !== undefined) throw exception

      return rest
    }
  }
}

exports.Call = Call
