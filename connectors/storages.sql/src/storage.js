'use strict'

const { Connector } = require('@toa.io/core')

const { to } = require('./.storage/translate')

/**
 * @implements {toa.sql.Storage}
 */
class Storage extends Connector {
  /** @type {toa.sql.Connection} */
  #connection

  /**
   * @param {toa.sql.Connection} connection
   */
  constructor (connection) {
    super()

    this.#connection = connection

    this.depends(connection)
  }

  async store (entity) {
    if (entity._version === 0) return this.#add(entity)
    else return this.#update(entity)
  }

  async #add (entity) {
    const object = to(entity)

    return this.#connection.insert(object)
  }

  async #update (entity) {
    const { id, _version } = entity
    const criteria = { id, _version }
    const object = to(entity)

    return this.#connection.update(criteria, object)
  }
}

exports.Storage = Storage
