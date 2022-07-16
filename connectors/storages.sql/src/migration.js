'use strict'

const knex = require('knex')

/**
 * @implements {toa.core.storages.Migration}
 */
class Migration {
  /** @type {import('knex').Knex} */
  #client

  constructor () {
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

const client = 'pg'

const connection = {
  user: 'developer',
  password: 'secret',
  database: 'postgres'
}

exports.Migration = Migration
