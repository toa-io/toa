'use strict'

const { console } = require('@toa.io/libraries.console')

const { Runtime } = require('./runtime')

class Remote extends Runtime {
  async connection () {
    console.info(`Remote '${this.locator.id}' connected`)
  }

  async disconnected () {
    console.info(`Remote '${this.locator.id}' disconnected`)
  }
}

exports.Remote = Remote
