'use strict'

const { freeze } = require('@toa.io/libraries/generic')

const { Operation } = require('./operation')

class Observation extends Operation {
  async acquire (store) {
    const scope = await this.query(store.request.query)
    const state = scope.get()

    freeze(state)

    store.scope = scope
    store.state = state
  }
}

exports.Observation = Observation
