'use strict'

const knex = require('knex')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/console')
const { resolve } = require('@toa.io/pointer')
const { ID } = require('./deployment')

class Connection extends Connector {
  table

  #locator

  /** @type {string} */
  #driver

  /** @type {import('knex').Knex} */
  #client

  constructor (locator) {
    super()

    this.#locator = locator
  }

  async open () {
    this.#client = this.#configure()

    // https://github.com/knex/knex/issues/1886
    await this.#client.raw('select 1')

    console.info('SQL storage connected')
  }

  async close () {
    await this.#client.destroy()

    console.info('SQL storage disconnected')
  }

  async insert (table, objects) {
    await this.#client.insert(objects).into(table)

    return true
  }

  #configure () {
    const references = this.#resolveURLs()
    const reference = references[0]
    const url = new URL(reference)
    let [, database, schema, table] = url.pathname.split('/')
    const client = url.protocol.slice(0, -1)

    if (schema === undefined) schema = this.#locator.namespace
    if (table === undefined) table = this.#locator.name

    this.table = `${schema}.${table}`

    const config = {
      client,
      connection: {
        host: url.hostname,
        port: url.port,
        user: url.username,
        password: url.password,
        database: database || process.env.TOA_STORAGES_SQL_DATABASE
      },
      pool: {
        min: 0
      }
    }

    return knex(config)
  }

  #resolveURLs () {
    if (process.env.TOA_DEV === '1') return ['pg://developer:secret@localhost']
    else return resolve(ID, this.#locator.id)
  }
}

exports.Connection = Connection
