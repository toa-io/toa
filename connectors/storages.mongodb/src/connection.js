// noinspection JSCheckFunctionSignatures

'use strict'

const { MongoClient } = require('mongodb')
const { Connector } = require('@toa.io/core')
const { resolve } = require('@toa.io/pointer')
const { Conveyor } = require('@toa.io/conveyor')
const { ID } = require('./deployment')

class Connection extends Connector {
  #locator
  /** @type {import('mongodb').MongoClient} */
  #client
  /** @type {import('mongodb').Collection<toa.mongodb.Record>} */
  #collection
  /** @type {toa.conveyor.Conveyor<toa.core.storages.Record, boolean>} */
  #conveyor

  constructor (locator) {
    super()

    this.#locator = locator
  }

  async open () {
    const urls = await this.#resolveURLs()
    const db = this.#locator.namespace
    const collection = this.#locator.name

    this.#client = new MongoClient(urls[0], OPTIONS)

    await this.#client.connect()

    this.#collection = this.#client.db(db).collection(collection)
    this.#conveyor = new Conveyor((objects) => this.addMany(objects))

    console.info('Storage Mongo connected')
  }

  async close () {
    await this.#client?.close()

    console.info('Storage Mongo disconnected')
  }

  /** @hot */
  async get (query, options) {
    return /** @type {toa.mongodb.Record} */ this.#collection.findOne(query, options)
  }

  /** @hot */
  async find (query, options) {
    const cursor = this.#collection.find(query, options)

    return cursor.toArray()
  }

  /** @hot */
  async add (record) {
    return this.#conveyor.process(record)
  }

  async addMany (records) {
    let result

    try {
      const response = await this.#collection.insertMany(records, { ordered: false })

      result = response.acknowledged
    } catch (e) {
      if (e.code === ERR_DUPLICATE_KEY) result = false
      else throw e
    }

    return result
  }

  /** @hot */
  async replace (query, record, options) {
    return await this.#collection.findOneAndReplace(query, record, options)
  }

  /** @hot */
  async update (query, update, options) {
    return this.#collection.findOneAndUpdate(query, update, options)
  }

  async #resolveURLs () {
    if (process.env.TOA_DEV === '1') return ['mongodb://developer:secret@localhost']
    else return await resolve(ID, this.#locator.id)
  }
}

const OPTIONS = {
  ignoreUndefined: true,
  connectTimeoutMS: 0,
  serverSelectionTimeoutMS: 0
}

const ERR_DUPLICATE_KEY = 11000

exports.Connection = Connection
