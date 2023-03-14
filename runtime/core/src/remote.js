'use strict'

const { console } = require('@toa.io/console')

const { Component } = require('./component')

class Remote extends Component {
  async open () {
    console.info(`Remote '${this.locator.id}' connected`)
  }

  async dispose () {
    console.info(`Remote '${this.locator.id}' disconnected`)
  }
}

exports.Remote = Remote
