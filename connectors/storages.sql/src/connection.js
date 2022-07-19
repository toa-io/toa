'use strict'

const knex = require('knex')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/libraries/console')

/**
 * @implements {toa.sql.Connection}
 */
class Connection extends Connector {
  /** @type {toa.sql.Pointer} */
  #pointer

  /** @type {string} */
  #driver

  /** @type {import('knex').Knex} */
  #client

  /**
   * @param {toa.sql.Pointer} pointer
   */
  constructor (pointer) {
    super()

    this.#pointer = pointer
    this.#driver = pointer.protocol.slice(0, -1)
  }

  async connection () {
    const config = this.#configure()

    this.#client = knex(config)

    // https://github.com/knex/knex/issues/1886
    await this.#client.raw('select 1')

    console.info(`SQL storage connected to ${this.#pointer.label}`)
  }

  async disconnection () {
    await this.#client.destroy()

    console.info(`SQL storage disconnected from ${this.#pointer.label}`)
  }

  async insert (entity) {
    const table = this.#pointer.table

    await this.#client.insert(entity).into(table)

    return true
  }

  #configure () {
    const pointer = this.#pointer

    return {
      client: this.#driver,
      connection: {
        host: pointer.hostname,
        port: pointer.port,
        user: pointer.username,
        password: pointer.password,
        database: pointer.database
      }
    }
  }
}

exports.Connection = Connection
