import assert from 'node:assert'
import { Component } from './component.js'

export class Remote extends Component {
  kind = 'client'

  explain (endpoint) {
    if (!(endpoint in this.operations))
      // `assert.fail`, not `assert.ok`: the message is built only when it is needed
      assert.fail(`Endpoint '${endpoint}' is not provided by '${this.locator.id}'`)

    return this.operations[endpoint].explain()
  }
}
