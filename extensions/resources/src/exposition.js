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
   * @param {Function} connect
   */
  constructor (broadcast, connect) {
    super()

    this.#broadcast = broadcast
    this.#remote = connect

    this.depends(broadcast)
  }

  async connection () {
    await this.#broadcast.receive('expose', (definition) => this.#expose(definition))
    this.#broadcast.send('ping', {})

    console.info(this.constructor.name + ' started')
  }

  async #expose (definition) {
    const { domain, name, resources } = definition
    const key = domain + '/' + name

    if (this.#remotes[key] === undefined) {
      this.#remotes[key] = this.#connect(domain, name, resources)
    } else {
      const remote = await this.#remotes[key]

      remote.update(resources)
    }
  }

  async #connect (domain, name, resources) {
    const remote = await this.#remote(domain, name, resources)

    await remote.connect()

    this.depends(remote)

    return remote
  }
}

exports.Exposition = Exposition
