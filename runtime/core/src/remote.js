'use strict'

const assert = require('node:assert')
const { Component } = require('./component')

class Remote extends Component {
  kind = 'client'

  explain (endpoint) {
    if (!(endpoint in this.operations))
      // `assert.fail`, not `assert.ok`: the message is built only when it is needed
      assert.fail(`Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].explain()
  }
}

exports.Remote = Remote
