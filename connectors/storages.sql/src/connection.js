'use strict'

const knex = require('knex')
const { Connector } = require('@toa.io/core')

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
    await this.#client.select('1')
  }

  async insert (entity) {
    await this.#client.insert(entity)

    return true
  }

  #configure () {
    const pointer = this.#pointer
    const [, database] = pointer.path.split('/')

    return {
      client: this.#driver,
      connection: {
        host: pointer.hostname,
        port: Number(pointer.port),
        user: pointer.username,
        password: pointer.password,
        database
      }
    }
  }
}

exports.Connection = Connection
