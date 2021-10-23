'use strict'

const { freeze } = require('@toa.io/gears')

const { Operation } = require('./operation')

class Observation extends Operation {
  #subject

  constructor (cascade, subject, contract, query) {
    super(cascade, subject, contract, query)

    this.#subject = subject
  }

  async acquire (scope) {
    const subject = await this.#subject.query(scope.request.query)
    const state = subject.get()

    freeze(state)

    scope.subject = subject
    scope.state = state
  }
}

exports.Observation = Observation
