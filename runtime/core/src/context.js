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

  async call (domain, name, endpoint, request) {
    const remote = await this.#remote(domain, name)

    return remote.invoke(endpoint, request)
  }

  async #remote (domain, name) {
    const key = domain + '.' + name

    if (this.#remotes[key] === undefined) this.#remotes[key] = this.#connect(domain, name)

    return this.#remotes[key]
  }

  async #connect (domain, name) {
    const remote = await this.#discover(domain, name)

    this.depends(remote)

    return remote
  }
}

exports.Context = Context
