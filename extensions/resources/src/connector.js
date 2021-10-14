'use strict'

const { Connector: Base } = require('@kookaburra/core')

class Connector extends Base {
  #binding
  #definition

  constructor (binding, { domain, name }, resources) {
    super()

    this.#binding = binding
    this.#definition = { domain, name, resources }

    this.depends(binding)
  }

  async connection () {
    await this.#binding.receive('ping', () => this.#expose())
    await this.#expose()
  }

  async #expose () {
    await this.#binding.send('expose', this.#definition)
  }
}

exports.Connector = Connector
