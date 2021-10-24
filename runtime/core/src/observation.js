'use strict'

const { freeze } = require('@toa.io/gears')

const { Operation } = require('./operation')

class Observation extends Operation {
  async acquire (scope) {
    const subject = await this.subject.query(scope.request.query)
    const state = subject.get()

    freeze(state)

    scope.subject = subject
    scope.state = state
  }
}

exports.Observation = Observation
