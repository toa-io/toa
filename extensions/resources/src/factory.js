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

  /** @type {toa.extensions.resources.Server} */
  #server

  constructor (boot) {
    this.#boot = boot
    this.#server = new Server()
  }

  connector (locator, declaration) {
    const broadcast = this.#boot.bindings.broadcast(BINDING, 'resources', locator.id)

    return new Connector(broadcast, locator, declaration)
  }

  service (name) {
    if (name === 'exposition') return this.#expose()
  }

  #expose () {
    const broadcast = this.#boot.bindings.broadcast(BINDING, 'resources')

    const connect = (domain, name) => this.#connect(domain, name)
    const exposition = new Exposition(broadcast, connect)

    exposition.depends(this.#server)

    return exposition
  }

  /**
   * @type {toa.extensions.resources.remote.Constructor}
   */
  async #connect (domain, name) {
    const locator = new Locator({ domain, name })
    const remote = await this.#boot.remote(locator)
    const query = (node) => this.#query(node)
    const tree = new Tree(query)

    return new Remote(this.#server, remote, tree)
  }

  /**
   * @param {toa.extensions.resources.declarations.Node} node
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
