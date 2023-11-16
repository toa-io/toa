'use strict'

const { Connector } = require('@toa.io/core')
const { Conveyor } = require('@toa.io/conveyor')

class Batcher extends Connector {
  /** @type {toa.mongodb.Connection} */
  #connection

  /** @type {toa.conveyor.Conveyor<toa.core.storages.Record, boolean>} */
  #conveyor

  constructor (connection) {
    super()

    this.#connection = connection

    this.depends(connection)
  }

  async open () {
    const add = (records) => this.#connection.add(records)

    this.#conveyor = new Conveyor(add)
  }

  async add (record) {
    return this.#conveyor.process(record)
  }
}

exports.Batcher = Batcher
