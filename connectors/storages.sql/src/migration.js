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

  async database (database) {
    try {
      await this.#client.raw(`create database ${database}`)
    } catch (e) {
      const duplicate = e.code === '42P04' // pg only

      if (!duplicate) throw e
    }

    await this.#reconnect(database)
  }

  async table (database, locator, object) {
    const properties = translate(object)
    const schema = `create schema "${locator.namespace}"`
    const table = `create table "${locator.namespace}"."${locator.name}" (${properties})`

    try {
      await this.#client.raw(schema)
      await this.#client.raw(table)
    } catch (e) {
      const duplicate = ['42P06', '42P07'].includes(e.code)

      if (!duplicate) throw e
    }
  }

  /**
   * @param {string} database
   * @return {Promise<void>}
   */
  async #reconnect (database) {
    await this.#client.destroy()

    const config = { client: this.#driver, connection: { ...connection, database } }

    this.#client = knex(config)
  }
}

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

exports.Migration = Migration
