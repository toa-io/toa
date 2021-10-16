'use strict'

const { MongoClient } = require('mongodb')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

class Client extends Connector {
  #connection

  #client
  #collection

  constructor (host, db, collection) {
    super()
    this.#connection = { host, db, collection }
    this.#client = new MongoClient(this.#url, OPTIONS)
  }

  async connection () {
    await this.#client.connect()

    this.#collection = this.#client.db(this.#connection.db).collection(this.#connection.collection)

    console.info('Storage MongoDB connected to ' +
      `${this.#url}/${this.#connection.db}/${this.#connection.collection}`)
  }

  async disconnection () {
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
    return this.#collection.findOneAndReplace(query, entry, options)
  }

  async find (query, options) {
    const cursor = await this.#collection.find(query, options)

    return cursor.toArray()
  }

  get #url () {
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
