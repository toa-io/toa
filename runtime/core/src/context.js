'use strict'

const { Connector } = require('./connector')

class Context extends Connector {
  #local
  #discover
  #remotes = {}

  constructor (local, discover) {
    super()

    this.#local = local
    this.#discover = discover

    this.depends(local)
  }

  async apply (endpoint, request) {
    return this.#local.invoke(endpoint, request)
  }

  async call (domain, name, endpoint, request) {
    const remote = await this.#remote(domain, name)

    return remote.invoke(endpoint, request)
  }

  async #remote (domain, name) {
    if (this.#remotes[domain] === undefined) this.#remotes[domain] = {}

    if (this.#remotes[domain][name] === undefined) {
      const remote = await this.#discover(domain, name)

      this.depends(remote)
      this.#remotes[domain][name] = remote
    }

    return this.#remotes[domain][name]
  }
}

exports.Context = Context
