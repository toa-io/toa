'use strict'

const { Connector } = require('@toa.io/core')

const { to } = require('./.storage/translate')

/**
 * @implements {toa.sql.Storage}
 */
class Storage extends Connector {
  /** @type {toa.sql.Client} */
  #client

  /**
   * @param {toa.sql.Client} client
   */
  constructor (client) {
    super()

    this.#client = client

    this.depends(client)
  }

  async store (entity) {
    if (entity._version === 0) return this.#add(entity)
    else return this.#update(entity)
  }

  async #add (entity) {
    const object = to(entity)

    return await this.#client.insert(object)
  }

  async #update (entity) {
    const { id, _version } = entity
    const criteria = { id, _version }
    const object = to(entity)

    return this.#client.update(criteria, object)
  }
}

exports.Storage = Storage
