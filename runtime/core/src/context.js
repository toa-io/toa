'use strict'

const { Connector } = require('./connector')

/**
 * @implements {toa.core.Context}
 */
class Context extends Connector {
  extensions

  #local
  #discover
  #remotes = {}

  constructor (local, discover, extensions = []) {
    super()

    this.extensions = extensions

    this.#local = local
    this.#discover = discover

    this.depends(local)
    if (extensions.length > 0) this.depends(extensions)
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
