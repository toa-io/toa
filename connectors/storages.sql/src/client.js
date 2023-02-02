'use strict'

const { Connector } = require('@toa.io/core')
const { Conveyor } = require('@toa.io/libraries/conveyor')

/**
 * @implements {toa.sql.Client}
 */
class Client extends Connector {
  /** @type {string} */
  #table

  /** @type {toa.sql.Connection} */
  #connection

  /** @type {toa.conveyor.Conveyor<toa.core.storages.Record, boolean>} */
  #conveyor

  /**
   * @param {toa.sql.Connection} connection
   * @param {toa.sql.Pointer} pointer
   */
  constructor (connection, pointer) {
    super()

    this.#connection = connection
    this.#table = pointer.table

    const insert = (objects) => connection.insert(this.#table, objects)
    this.#conveyor = new Conveyor(insert)

    this.depends(connection)
  }

  async insert (object) {
    return this.#conveyor.process(object)
  }

  update (criteria, object) {
    return this.#connection.update(this.#table, criteria, object)
  }
}

exports.Client = Client
