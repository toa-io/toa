'use strict'

const { retry } = require('@toa.io/gears')

const { Operation } = require('./operation')
const { StateConcurrencyException } = require('./exceptions')

class Transition extends Operation {
  #subject
  #concurrency

  constructor (cascade, subject, contract, query, definition) {
    super(cascade, subject, contract, query)

    this.#subject = subject
    this.#concurrency = definition.concurrency
  }

  async process (scope) {
    return retry((retry) => this.#retry(scope, retry), { base: 0 })
  }

  async acquire (scope) {
    const { request } = scope

    scope.subject = request.query ? await this.#subject.query(request.query) : this.#subject.init()
    scope.state = scope.subject.get()
  }

  async commit (scope) {
    const { subject, state, reply, retry } = scope

    if (reply.error !== undefined) return

    subject.set(state)

    const ok = await this.#subject.commit(subject)

    if (ok !== true) {
      if (this.#concurrency === 'retry') retry()
      else throw new StateConcurrencyException()
    }
  }

  async #retry (scope, retry) {
    scope.retry = retry

    return super.process(scope)
  }
}

exports.Transition = Transition
