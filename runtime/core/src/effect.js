'use strict'

const { Observation } = require('./observation')

class Effect extends Observation {

  async acquire (store) {
    const { query, entity } = store.request

    if (entity === undefined)
      return super.acquire(store)

    store.scope = await this.scope.ensure(query, entity)
    store.state = store.scope.get()
  }

}

exports.Effect = Effect
