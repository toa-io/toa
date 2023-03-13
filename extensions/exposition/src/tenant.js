'use strict'

const { Connector } = require('@toa.io/core')

class Tenant extends Connector {
  #binding
  #declaration

  constructor (binding, { namespace, name }, resources) {
    super()

    this.#binding = binding
    this.#declaration = { namespace, name, resources }

    this.depends(binding)
  }

  async open () {
    await this.#binding.receive('ping', () => this.#expose())
    await this.#expose()
  }

  async #expose () {
    await this.#binding.send('expose', this.#declaration)
  }
}

exports.Tenant = Tenant
