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
    this.#client = new MongoClient(url, OPTIONS)
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
    // TODO: see ./deployment.js
    const user = 'user'
    const password = 'password'

    return `mongodb://${user}:${password}@${this.#connection.host}:27017/?authSource=${this.#connection.db}&readPreference=primary&appname=svc&ssl=false`
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Client = Client
