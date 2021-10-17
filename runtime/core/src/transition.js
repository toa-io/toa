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

  async process (request = {}) {
    return retry((retry) => this.#process(request, retry), { base: 0 })
  }

  async #process (request, retry) {
    const subject = request.query ? await this.#subject.query(request.query) : this.#subject.init()
    const state = subject.get()
    const reply = await this.run(request, state)

    if (reply.error === undefined) {
      subject.set(state)

      const ok = await this.#subject.commit(subject)

      if (ok !== true) {
        if (this.#concurrency === 'retry') retry()
        else throw new StateConcurrencyException()
      }
    }

    return reply
  }
}

exports.Transition = Transition
