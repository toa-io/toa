'use strict'

const { Connector } = require('@toa.io/core')

class Storage extends Connector {
  /** @type {toa.sql.Client} */
  #client

  constructor (client) {
    super()

    this.#client = client

    this.depends(client)
  }

  async store (entity) {
    // the entity carries the version it is being stored with,
    // so the first one it ever has is the one a new row gets
    if (entity._version === 1) return this.#add(entity)
    else return this.#update(entity)
  }

  async #add (entity) {
    return this.#client.insert({ ...entity })
  }

  async #update (entity) {
    const criteria = { id: entity.id, _version: entity._version - 1 }

    return this.#client.update(criteria, { ...entity })
  }
}

exports.Storage = Storage
