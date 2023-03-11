'use strict'

const { Connector } = require('./connector')

/**
 * @implements {toa.core.Context}
 */
class Context extends Connector {
  aspects

  #local
  #discover
  #remotes = {}

  constructor (local, discover, aspects = []) {
    super()

    this.aspects = aspects

    this.#local = local
    this.#discover = discover

    this.depends(local)

    if (aspects.length > 0) this.depends(aspects)
  }

  async apply (endpoint, request) {
    return this.#local.invoke(endpoint, request)
  }

  async call (namespace, name, endpoint, request) {
    const remote = await this.#remote(namespace, name)

    return remote.invoke(endpoint, request)
  }

  async #remote (namespace, name) {
    const key = namespace + '.' + name

    if (this.#remotes[key] === undefined) this.#remotes[key] = this.#connect(namespace, name)

    return this.#remotes[key]
  }

  async #connect (namespace, name) {
    const remote = await this.#discover(namespace, name)

    this.depends(remote)

    return remote
  }
}

exports.Context = Context
