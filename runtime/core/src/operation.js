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
      const context = await this.preprocess(request)
      const reply = await this.process(context)

      await this.postprocess(context, reply)

      return reply
    } catch (e) {
      const exception = e instanceof Error ? new Exception(e) : e

      return { exception }
    }
  }

  async preprocess (request) {
    if (request?.query === undefined) return { request }

    const query = this.#query.parse(request.query)
    const subject = await this.#subject.query(query)
    const state = subject === null ? null : subject.get()

    return { request, subject, state }
  }

  async process ({ request, state }) {
    if (request?.query !== undefined && state === null) return { output: null } // not found

    const reply = await this.#cascade.run(request?.input, state)

    this.#contract.fit(reply)

    return reply
  }

  postprocess (context, reply) {}
}

exports.Operation = Operation
