'use strict'

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

class Exposition extends Connector {
  /** @type {toa.core.bindings.Broadcaster} */
  #broadcast
  /** @type {toa.extensions.resources.remote.Constructor} */
  #remote
  /** @type {toa.extensions.resources.exposition.Remotes} */
  #remotes = {}

  /**
   * @param {toa.core.bindings.Broadcaster} broadcast
   * @param {toa.extensions.resources.remote.Constructor} connect
   */
  constructor (broadcast, connect) {
    super()

    this.#broadcast = broadcast
    this.#remote = connect

    this.depends(broadcast)
  }

  async connection () {
    await this.#broadcast.receive('expose', (declaration) => this.#expose(declaration))
    this.#broadcast.send('ping', {})

    console.info(this.constructor.name + ' started')
  }

  /**
   * @param {toa.extensions.resources.declarations.Exposition | object} declaration
   * @return {Promise<void>}
   */
  async #expose (declaration) {
    const { domain, name, resources } = declaration
    const key = domain + '/' + name

    if (this.#remotes[key] === undefined) this.#remotes[key] = this.#connect(domain, name)

    const remote = await this.#remotes[key]

    remote.update(resources)
  }

  /**
   * @param {string} domain
   * @param {string} name
   * @return {Promise<Remote>}
   */
  async #connect (domain, name) {
    const remote = await this.#remote(domain, name)

    await remote.connect()

    this.depends(remote)

    return remote
  }
}

exports.Exposition = Exposition
