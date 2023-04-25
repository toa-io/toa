'use strict'

const { Connector } = require('./connector')
const { SystemException } = require('./exceptions')

class Operation extends Connector {
  scope

  #cascade
  #contract
  #query
  #scope

  constructor (cascade, scope, contract, query, definition) {
    super()

    this.scope = scope

    this.#cascade = cascade
    this.#contract = contract
    this.#query = query
    this.#scope = definition.scope

    this.depends(cascade)
  }

  async invoke (request) {
    try {
      if (request.query) request.query = this.#query.parse(request.query)

      const store = { request }

      return await this.process(store)
    } catch (e) {
      const exception = e instanceof Error ? new SystemException(e) : e

      return { exception }
    }
  }

  async process (store) {
    await this.acquire(store)
    await this.run(store)
    await this.commit(store)

    return store.reply
  }

  async acquire () {}

  async run (store) {
    const { request, state } = store
    const reply = await this.#cascade.run(request.input, state) || {}

    this.#contract.fit(reply)

    store.reply = reply
  }

  async commit () {}

  async query (query) {
    return this.scope[this.#scope](query)
  }
}

exports.Operation = Operation
