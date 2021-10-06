'use strict'

const { Connector } = require('./connector')

class Apply extends Connector {
  #runtime
  #endpoint
  #contract

  constructor (runtime, endpoint, contract) {
    super()

    this.#runtime = runtime
    this.#endpoint = endpoint
    this.#contract = contract

    this.depends(runtime)
  }

  apply (request) {
    if (request !== undefined) this.#contract.fit(request)

    this.#runtime.invoke(this.#endpoint, request)
  }
}

exports.Apply = Apply
