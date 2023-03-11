'use strict'

const { Operation } = require('./operation')

class Assignment extends Operation {
  async acquire (store) {
    store.scope = this.scope.changeset(store.request.query)
    store.state = store.scope.get()
  }

  async commit (store) {
    const { scope, state, reply } = store

    if (reply.error !== undefined) return

    scope.set(state)

    await this.scope.apply(scope)
  }
}

exports.Assignment = Assignment
