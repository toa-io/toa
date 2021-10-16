'use strict'

const { freeze } = require('@toa.io/gears')

const { Operation } = require('./operation')

class Observation extends Operation {
  #subject

  constructor (cascade, subject, contract, query) {
    super(cascade, subject, contract, query)

    this.#subject = subject
  }

  async process (request) {
    let subject, state

    if (request.query) {
      subject = await this.#subject.query(request.query)

      if (subject !== null) {
        state = subject.get()
        freeze(state)
      } else state = null
    }

    return this.run(request, state)
  }
}

exports.Observation = Observation
