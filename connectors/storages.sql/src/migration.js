'use strict'

const knex = require('knex')

/**
 * @implements {toa.core.storages.Migration}
 */
class Migration {
  /** @type {import('knex').Knex} */
  #client

  /**
   * @param {string} client
   */
  constructor (client) {
    this.#client = knex({ client, connection })
  }

  async database (name) {
    try {
      await this.#client.raw(`create database ${name}`)
    } catch (e) {
      const duplicate = e.code === '42P04'

      if (!duplicate) throw e
    }
  }

  async table (name, locator, schema) {
  }
}

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

exports.Migration = Migration
