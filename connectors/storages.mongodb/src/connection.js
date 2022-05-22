// noinspection JSClosureCompilerSyntax

'use strict'

const { MongoClient } = require('mongodb')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

/**
 * @implements {toa.storages.mongo.Connection}
 */
class Connection extends Connector {
  /** @type {toa.storages.mongo.Locator} */
  #locator
  /** @type {import('mongodb').MongoClient} */
  #client
  /** @type {import('mongodb').Collection} */
  #collection

  /**
   * @param {toa.storages.mongo.Locator} locator
   */
  constructor (locator) {
    super()

    this.#locator = locator
    this.#client = new MongoClient(locator.href, OPTIONS)
  }

  async connection () {
    await this.#client.connect()

    this.#collection = this.#client.db(this.#locator.db).collection(this.#locator.collection)

    console.info(`Storage Mongo connected to ${this.#locator.hostname}/${this.#locator.db}/${this.#locator.collection}`)
  }

  async disconnection () {
    await this.#client.close()

    console.info(`Storage Mongo disconnected from ${this.#locator.hostname}/${this.#locator.db}/${this.#locator.collection}`)
  }

  /** @hot */
  async get (query, options) {
    return this.#collection.findOne(query, options)
  }

  /** @hot */
  async find (query, options) {
    const cursor = await this.#collection.find(query, options)

    return cursor.toArray()
  }

  /** @hot */
  async add (record) {
    const result = await this.#collection.insertOne(record)

    return result.acknowledged
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
