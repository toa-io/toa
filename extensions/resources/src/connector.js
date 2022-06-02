'use strict'

const { Connector: Base } = require('@toa.io/core')

class Connector extends Base {
  #binding
  #declaration

  constructor (binding, { domain, name }, resources) {
    super()

    this.#binding = binding
    this.#declaration = { domain, name, resources }

    this.depends(binding)
  }

  async connection () {
    await this.#binding.receive('ping', () => this.#expose())
    await this.#expose()
  }

  async #expose () {
    await this.#binding.send('expose', this.#declaration)
  }
}

exports.Connector = Connector
