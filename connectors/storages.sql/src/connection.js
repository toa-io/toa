'use strict'

const knex = require('knex')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/libraries/console')

/**
 * @implements {toa.sql.Connection}
 */
class Connection extends Connector {
  static #connections = {}

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

    const key = pointer.key
    const connections = Connection.#connections

    if (connections[key] !== undefined) return connections[key]
    else connections[key] = this

    this.#pointer = pointer
    this.#driver = pointer.protocol.slice(0, -1)
    this.#client = this.#configure()
  }

  async connection () {
    // https://github.com/knex/knex/issues/1886
    await this.#client.raw('select 1')

    console.info(`SQL storage connected to ${this.#pointer.label}`)
  }

  async disconnection () {
    delete Connection.#connections[this.#pointer.key]
    await this.#client.destroy()

    console.info(`SQL storage disconnected from ${this.#pointer.label}`)
  }

  async insert (table, objects) {
    await this.#client.insert(objects).into(table)

    return true
  }

  #configure () {
    const pointer = this.#pointer

    const config = {
      client: this.#driver,
      connection: {
        host: pointer.hostname,
        port: pointer.port,
        user: pointer.username,
        password: pointer.password,
        database: pointer.database
      },
      pool: {
        min: 0
      }
    }

    return knex(config)
  }
}

exports.Connection = Connection
