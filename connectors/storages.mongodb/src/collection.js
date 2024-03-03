'use strict'

const { Connector } = require('@toa.io/core')

class Collection extends Connector {
  #client
  #collection

  constructor (client) {
    super()

    this.#client = client

    this.depends(client)
  }

  async open () {
    this.#collection = this.#client.collection
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
    return await this.#collection.insertOne(record)
  }

  /** @hot */
  async replace (query, record, options) {
    return await this.#collection.findOneAndReplace(query, record, options)
  }

  /** @hot */
  async update (query, update, options) {
    return this.#collection.findOneAndUpdate(query, update, options)
  }

  async index (keys, options) {
    return this.#collection.createIndex(keys, options)
  }

  async indexes () {
    try {
      const array = await this.#collection.listIndexes().toArray()

      return array.map(({ name }) => name).filter((name) => name !== '_id_')
    } catch {
      return []
    }
  }

  async dropIndexes (names) {
    const all = names.map((name) => this.#collection.dropIndex(name))

    return Promise.all(all)
  }
}

exports.Collection = Collection
