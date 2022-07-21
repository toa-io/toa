'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.sql.Client}
 */
class Client extends Connector {
  /** @type {string} */
  #table

  /** @type {toa.sql.Connection} */
  #connection

  /**
   * @param {toa.sql.Connection} connection
   * @param {toa.sql.Pointer} pointer
   */
  constructor (connection, pointer) {
    super()

    this.#connection = connection
    this.#table = pointer.table

    this.depends(connection)
  }

  async insert (object) {
    return this.#connection.insert(this.#table, object)
  }

  update (criteria, object) {
    return this.#connection.update(this.#table, criteria, object)
  }
}

exports.Client = Client
