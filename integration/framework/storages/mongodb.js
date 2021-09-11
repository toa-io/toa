'use strict'

const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')

class Storage {
  #server
  #db
  #collection

  client

  constructor (db, collection) {
    this.#db = db
    this.#collection = collection
  }

  async setup () {
    this.#server = await MongoMemoryServer.create()

    const uri = this.#server.getUri()

    process.env.KOO_MONGODB_URL = uri

    this.client = new MongoClient(uri, OPTIONS)
    await this.client.connect()
  }

  collection (db, collection) {
    return this.client.db(db).collection(collection)
  }

  async teardown () {
    this.client.close()
    this.#server.stop()
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Storage = Storage
