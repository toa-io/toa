'use strict'

const binding = require('@toa.io/bindings.amqp')
const boot = require('@toa.io/boot')
const { Locator } = require('@toa.io/core')

const { Connector } = require('./connector')
const { Resources } = require('./resources')
const { Server } = require('./server')
const { Remote } = require('./remote')
const { Tree } = require('./tree')

class Factory {
  #binding

  constructor () {
    this.#binding = new binding.Factory()
  }

  connector (locator, definition) {
    const broadcast = this.#binding.broadcast('resources', locator.id)

    return new Connector(broadcast, locator, definition)
  }

  process () {
    const server = new Server()
    const broadcast = this.#binding.broadcast('resources')

    return new Resources(server, broadcast, async (domain, name, definition) => {
      const locator = new Locator({ domain, name })
      const remote = await boot.remote(locator.id)
      const tree = new Tree(definition)

      return new Remote(server, remote, tree)
    })
  }
}

exports.Factory = Factory
