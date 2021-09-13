'use strict'

const { console } = require('@kookaburra/gears')

const { Runtime } = require('./runtime')

class Remote extends Runtime {
  async connection () {
    console.info(`Remote '${this.locator.fqn}' connected`)
  }

  async disconnection () {
    console.info(`Remote '${this.locator.fqn}' disconnected`)
  }
}

exports.Remote = Remote
