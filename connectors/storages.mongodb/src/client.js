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

    const url = this.#url()
    this.#client = new MongoClient(url.href, OPTIONS)
  }

  async connection () {
    await this.#client.connect()

    this.#collection = this.#client.db(this.#connection.db).collection(this.#connection.collection)

    console.info(`Storage MongoDB connected to ${this.#url()}`)
  }

  async disconnection () {
    await this.#client.close()

    console.info('Storage MongoDB disconnected from ' +
      `${this.#url}/${this.#connection.db}/${this.#connection.collection}`)
  }

  async add (record) {
    const { acknowledged } = await this.#collection.insertOne(record)

    return acknowledged
  }

  async get (query, options) {
    return await this.#collection.findOne(query, options)
  }

  async replace (query, record, options) {
    return this.#collection.findOneAndReplace(query, record, options)
  }

  async update (query, update, options) {
    return this.#collection.findOneAndUpdate(query, update, options)
  }

  async find (query, options) {
    const cursor = await this.#collection.find(query, options)

    return cursor.toArray()
  }

  #url () {
    const url = new URL('mongodb://')

    if (process.env.TOA_ENV === 'local') {
      url.hostname = 'localhost'
    } else {
      url.username = 'user'
      url.password = 'password'

      const query = url.searchParams

      query.append('authSource', this.#connection.db)
      query.append('readPreference', 'primary')
      query.append('appname', 'svc')
      query.append('ssl', 'false')
    }

    return url
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Client = Client
