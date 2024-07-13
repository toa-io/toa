'use strict'

const assert = require('node:assert')
const { Component } = require('./component')

class Remote extends Component {
  explain (endpoint) {
    assert.ok(endpoint in this.operations,
      `Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].explain()
  }
}

exports.Remote = Remote
