'use strict'

const { console } = require('@toa.io/gears')

const { Runtime } = require('./runtime')

class Remote extends Runtime {
  async connection () {
    console.info(`Remote '${this.locator.id}' connected`)
  }

  async disconnection () {
    console.info(`Remote '${this.locator.id}' disconnected`)
  }
}

exports.Remote = Remote
