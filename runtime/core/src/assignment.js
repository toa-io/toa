'use strict'

const { Operation } = require('./operation')

class Assignment extends Operation {
  async acquire (scope) {
    scope.subject = this.subject.changeset(scope.request.query)
    scope.state = scope.subject.get()
  }

  async commit (scope) {
    const { subject, state, reply } = scope

    if (reply.error !== undefined) return

    subject.set(state)

    await this.subject.apply(subject)
  }
}

exports.Assignment = Assignment
