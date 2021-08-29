'use strict'

const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')

class Storage {
  #server
  #db
  #collection
  #KOO_DEV_MONGODB_URL

  client
  collection

  constructor (db, collection) {
    this.#db = db
    this.#collection = collection
  }

  async setup () {
    this.#KOO_DEV_MONGODB_URL = process.env.KOO_DEV_MONGODB_URL

    this.#server = await MongoMemoryServer.create()

    const uri = this.#server.getUri()

    process.env.KOO_DEV_MONGODB_URL = uri

    this.client = new MongoClient(uri, OPTIONS)
    await this.client.connect()

    this.collection = this.client.db(this.#db).collection(this.#collection)
  }

  async teardown () {
    this.client.close()
    this.#server.stop()

    process.env.KOO_DEV_MONGODB_URL = this.#KOO_DEV_MONGODB_URL
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Storage = Storage
