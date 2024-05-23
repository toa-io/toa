'use strict'

const { Connector } = require('./connector')
const { SystemException, RequestContractException } = require('./exceptions')
const { Readable } = require('node:stream')

class Operation extends Connector {
  scope

  #cascade
  #contracts
  #query
  #scope

  constructor (cascade, scope, contracts, query, definition) {
    super()

    this.scope = scope

    this.#cascade = cascade
    this.#contracts = contracts
    this.#query = query
    this.#scope = definition.scope

    this.depends(cascade)
  }

  async invoke (request) {
    try {
      if (request.authentic !== true)
        this.#contracts.request.fit(request)

      if ('query' in request)
        request.query = this.#query.parse(request.query)

      // validate entity
      if ('entity' in request)
        this.scope.fit(request.entity)

      const store = { request }

      return await this.process(store)
    } catch (e) {
      console.error(e)

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

  async acquire (store) {
    if (this.#scope === 'none')
      return

    const scope = await this.query(store.request.query)
    const raw = scope === null || scope instanceof Readable

    store.scope = scope
    store.state = raw ? scope : scope.get()
  }

  async run (store) {
    const { request, state } = store
    const reply = await this.#cascade.run(request.input, state)

    // validate only on dev environment
    this.#contracts.reply.fit(reply)

    store.reply = reply
  }

  async commit () {}

  async query (query) {
    if (query === undefined)
      throw new RequestContractException('Request query is required')

    return this.scope[this.#scope](query)
  }
}

exports.Operation = Operation
