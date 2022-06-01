'use strict'

const { Locator } = require('@toa.io/core')
const { remap } = require('@toa.io/gears')

const { Connector } = require('./connector')
const { Exposition } = require('./exposition')
const { Server } = require('./server')
const { Remote } = require('./remote')
const { Tree } = require('./tree')
const { Query, constraints } = require('./query')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  #boot

  constructor (boot) {
    this.#boot = boot
  }

  connector (locator, definition) {
    const broadcast = this.#boot.bindings.broadcast(BINDING, 'resources', locator.id)

    return new Connector(broadcast, locator, definition)
  }

  service (name) {
    if (name === 'exposition') return this.#expose()
  }

  #expose () {
    const server = new Server()
    const broadcast = this.#boot.bindings.broadcast(BINDING, 'resources')

    const connect = this.#connect(server)
    const exposition = new Exposition(broadcast, connect)

    exposition.depends(server)

    return exposition
  }

  #connect (server) {
    return async (domain, name, definition) => {
      const locator = new Locator({ domain, name })
      const remote = await this.#boot.remote(locator)
      const query = (node) => this.#query(node)
      const tree = new Tree(definition, query)

      return new Remote(server, remote, tree)
    }
  }

  /**
   * @param {toa.extensions.resources.definitions.Node} node
   * @returns {toa.extensions.resources.Query}
   */
  #query (node) {
    const query = Query.merge(node)
    const properties = remap(query, (value, key) => new constraints[key](value))

    return new Query(properties)
  }
}

const BINDING = '@toa.io/bindings.amqp'

exports.Factory = Factory
