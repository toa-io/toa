'use strict'

const { Connector } = require('./connector')
const { Exception } = require('./exception')

class Operation extends Connector {
  #cascade
  #subject
  #contract
  #query

  constructor (cascade, subject, contract, query) {
    super()

    this.#cascade = cascade
    this.#subject = subject
    this.#contract = contract
    this.#query = query

    this.depends(cascade)
  }

  async invoke (request) {
    try {
      if (request?.query) request.query = this.#query.parse(request.query)

      return await this.process(request)
    } catch (e) {
      const exception = e instanceof Error ? new Exception(e) : e

      return { exception }
    }
  }

  async run (request, state) {
    if (request?.query !== undefined && state === null) return { output: null } // not found

    const reply = await this.#cascade.run(request?.input, state)

    this.#contract.fit(reply)

    return reply
  }

  async process () {}
}

exports.Operation = Operation
