'use strict'

const { console } = require('@toa.io/console')

const { Component } = require('./component')

class Remote extends Component {
  async connection () {
    console.info(`Remote '${this.locator.id}' connected`)
  }

  async disconnected () {
    console.info(`Remote '${this.locator.id}' disconnected`)
  }
}

exports.Remote = Remote
