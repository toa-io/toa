'use strict'

const { Connector: Base } = require('@toa.io/core')

class Connector extends Base {
  #binding
  #declaration

  constructor (binding, { namespace, name }, resources) {
    super()

    this.#binding = binding
    this.#declaration = { namespace, name, resources }

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
