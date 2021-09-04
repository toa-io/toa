'use strict'

const { MongoClient } = require('mongodb')
const { console } = require('@kookaburra/gears')

class Client {
  #connection

  #client
  #collection

  constructor (host, db, collection) {
    this.#connection = { host, db, collection }
    this.#client = new MongoClient(this.#url, OPTIONS)
  }

  async connect () {
    await this.#client.connect()

    this.#collection = this.#client
      .db(this.#connection.db)
      .collection(this.#connection.collection)

    console.info('Storage MongoDB connected to ' +
      `${this.#url}/${this.#connection.db}/${this.#connection.collection}`)
  }

  async disconnect () {
    await this.#client.close()

    console.info('Storage MongoDB disconnected from ' +
      `${this.#url}/${this.#connection.db}/${this.#connection.collection}`)
  }

  async add (entry) {
    const { acknowledged } = await this.#collection.insertOne(entry)

    return acknowledged
  }

  async get (query, options) {
    return await this.#collection.findOne(query, options)
  }

  async update (query, entry, options) {
    const { ok } = await this.#collection.findOneAndReplace(query, entry, options)

    return ok
  }

  async find (query, options) {
    const cursor = await this.#collection.find(query, options)

    return cursor.toArray()
  }

  get #url () {
    if (process.env.KOO_MONGODB_URL) return process.env.KOO_MONGODB_URL
    if (process.env.KOO_ENV === 'dev') return 'mongodb://localhost'

    return `mongodb+srv://${this.#connection.host}`
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Client = Client
