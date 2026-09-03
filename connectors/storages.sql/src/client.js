import { Connector } from '@toa.io/core'
import { Conveyor } from '@toa.io/conveyor'

export class Client extends Connector {
  /** @type {string} */
  #table

  /** @type {toa.sql.Connection} */
  #connection

  /** @type {toa.conveyor.Conveyor<toa.core.storages.Record, boolean>} */
  #conveyor

  constructor (connection) {
    super()

    this.#connection = connection

    this.depends(connection)
  }

  async open () {
    this.#table = this.#connection.table

    const insert = (objects) => this.#connection.insert(this.#table, objects)

    this.#conveyor = new Conveyor(insert)
  }

  async insert (object) {
    return this.#conveyor.process(object)
  }

  update (criteria, object) {
    return this.#connection.update(this.#table, criteria, object)
  }
}
