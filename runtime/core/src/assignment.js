'use strict'

const { Operation } = require('./operation')

class Assignment extends Operation {
  async acquire (store) {
    store.scope = this.scope.changeset(store.request.query)
    store.state = store.scope.get()
  }

  async commit (store) {
    const {
      scope,
      state,
      reply,
      request
    } = store

    if (reply.error !== undefined) return

    scope.set(state)

    const output = await this.scope.apply(scope, request.input)

    // assignment returns new state by default
    if (store.reply.output === undefined) {
      store.reply.output = output
    }
  }
}

exports.Assignment = Assignment
