'use strict'

const { State } = require('./state')

class Object extends State {
  async query (query) {
    return await this.object(query)
  }
}

exports.Object = Object
