// noinspection JSCheckFunctionSignatures

'use strict'

const { MongoClient } = require('mongodb')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/console')
const { resolve } = require('@toa.io/pointer')
const { ID } = require('./deployment')

class Connection extends Connector {
  #locator
  /** @type {import('mongodb').MongoClient} */
  #client
  /** @type {import('mongodb').Collection<toa.mongodb.Record>} */
  #collection

  constructor (locator) {
    super()

    this.#locator = locator
  }

  async open () {
    const urls = this.#resolveURLs()
    const db = this.#locator.namespace
    const collection = this.#locator.name

    this.#client = new MongoClient(urls[0], OPTIONS)

    await this.#client.connect()

    this.#collection = this.#client.db(db).collection(collection)

    console.info('Storage Mongo connected')
  }

  async close () {
    await this.#client.close()

    console.info('Storage Mongo disconnected')
  }

  /** @hot */
  async get (query, options) {
    return /** @type {toa.mongodb.Record} */ this.#collection.findOne(query, options)
  }

  /** @hot */
  async find (query, options) {
    const cursor = await this.#collection.find(query, options)

    return cursor.toArray()
  }

  /** @hot */
  async add (record) {
    /** @type {boolean} */
    let result

    try {
      const response = await this.#collection.insertOne(record)

      result = response.acknowledged
    } catch (e) {
      if (e.code === 11000) result = false // duplicate id
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

  #resolveURLs () {
    if (process.env.TOA_DEV === '1') return ['mongodb://developer:secret@localhost']
    else return resolve(ID, this.#locator.id)
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Connection = Connection
