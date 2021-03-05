'use strict'

const { State } = require('./state')

class Collection extends State {
  async query (query) {
    return await this.collection(query)
  }
}

exports.Collection = Collection
