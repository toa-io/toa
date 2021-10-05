'use strict'

const { Operation } = require('./operation')

class Transition extends Operation {
  #subject

  constructor (cascade, subject, contract, query) {
    super(cascade, subject, contract, query)

    this.#subject = subject
  }

  async preprocess (request) {
    if (request?.query !== undefined) return super.preprocess(request)

    const subject = this.#subject.init()
    const state = subject.get()

    return { request, subject, state }
  }

  async postprocess ({ subject, state }, reply) {
    if (state === null || reply.error !== undefined) return

    subject.set(state)

    await this.#subject.commit(subject)
  }
}

exports.Transition = Transition
