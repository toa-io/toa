'use strict'

const { Connector } = require('./connector')
const { SystemException } = require('./exceptions')

class Operation extends Connector {
  subject

  #cascade
  #contract
  #query

  constructor (cascade, subject, contract, query) {
    super()

    this.subject = subject

    this.#cascade = cascade
    this.#contract = contract
    this.#query = query

    this.depends(cascade)
  }

  async invoke (request) {
    try {
      if (request.query) request.query = this.#query.parse(request.query)

      const scope = { request }

      return await this.process(scope)
    } catch (e) {
      const exception = e instanceof Error ? new SystemException(e) : e

      return { exception }
    }
  }

  async process (scope) {
    await this.acquire(scope)
    await this.run(scope)
    await this.commit(scope)

    return scope.reply
  }

  async acquire () {}

  async run (scope) {
    const { request, state } = scope
    const reply = await this.#cascade.run(request.input, state) || {}

    this.#contract.fit(reply)

    scope.reply = reply
  }

  async commit () {}
}

exports.Operation = Operation
