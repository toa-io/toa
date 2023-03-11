// noinspection JSCheckFunctionSignatures

'use strict'

const { MongoClient } = require('mongodb')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/console')

/**
 * @implements {toa.mongodb.Connection}
 */
class Connection extends Connector {
  /** @type {toa.mongodb.Pointer} */
  #pointer
  /** @type {import('mongodb').MongoClient} */
  #client
  /** @type {import('mongodb').Collection<toa.mongodb.Record>} */
  #collection

  /**
   * @param {toa.mongodb.Pointer} pointer
   */
  constructor (pointer) {
    super()

    this.#pointer = pointer
    this.#client = new MongoClient(pointer.reference, OPTIONS)
  }

  async connection () {
    await this.#client.connect()

    this.#collection = this.#client.db(this.#pointer.db).collection(this.#pointer.collection)

    console.info(`Storage Mongo connected to ${this.#pointer.label}/${this.#pointer.db}/${this.#pointer.collection}`)
  }

  async disconnection () {
    await this.#client.close()

    console.info(`Storage Mongo disconnected from ${this.#pointer.label}/${this.#pointer.db}/${this.#pointer.collection}`)
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
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Connection = Connection
