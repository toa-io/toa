'use strict'

const knex = require('knex')

const { translate } = require('./.migration/translate')

/**
 * @implements {toa.core.storages.Migration}
 */
class Migration {
  /** @type {string} */
  #driver

  /** @type {import('knex').Knex} */
  #client

  /**
   * @param {string} client
   */
  constructor (client) {
    this.#client = knex({ client, connection })
    this.#driver = client
  }

  async disconnect () {
    await this.#client.destroy()
  }

  async database (database) {
    try {
      await this.#client.raw(`create database ${database}`)
    } catch (e) {
      const duplicate = e.code === '42P04' // pg only

      if (!duplicate) throw e
    }

    await this.#reconnect(database)
  }

  async table (database, locator, object, reset = false) {
    const properties = translate(object)
    const name = `${locator.namespace}.${locator.name}`
    const schema = `create schema ${locator.namespace}`
    const table = `create table ${name} (${properties})`

    if (reset) {
      const drop = `drop table ${name}`

      await this.#query(drop)
    }

    await this.#query(schema)
    await this.#query(table)

    return name
  }

  /**
   * @param {string} database
   * @return {Promise<void>}
   */
  async #reconnect (database) {
    await this.disconnect()

    const config = { client: this.#driver, connection: { ...connection, database } }

    this.#client = knex(config)
  }

  async #query (query) {
    try {
      await this.#client.raw(query)
    } catch (e) {
      // https://www.postgresql.org/docs/current/errcodes-appendix.html
      const ignore = ['42P01', '42P06', '42P07'].includes(e.code)

      if (!ignore) throw e
    }
  }
}

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

exports.Migration = Migration
