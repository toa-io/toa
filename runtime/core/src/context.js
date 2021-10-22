'use strict'

const { Connector } = require('./connector')

class Context extends Connector {
  #local
  #connect
  #remotes = {}

  constructor (local, connect) {
    super()

    this.#local = local
    this.#connect = connect

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
      this.#remotes[domain][name] = await this.#connect(domain, name)
      this.depends(this.#remotes[domain][name])
    }

    return this.#remotes[domain][name]
  }
}

exports.Context = Context
