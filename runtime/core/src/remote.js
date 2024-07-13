'use strict'

const assert = require('node:assert')
const { Component } = require('./component')

class Remote extends Component {
  async open () {
    console.info(`Remote '${this.locator.id}' connected`)
  }

  async dispose () {
    console.info(`Remote '${this.locator.id}' disconnected`)
  }

  explain (endpoint) {
    assert.ok(endpoint in this.operations,
      `Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].explain()
  }
}

exports.Remote = Remote
