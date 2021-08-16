'use strict'

const { MongoClient } = require('mongodb')

class Client {
  #locator

  #client
  #collection

  constructor (host, db, collection) {
    this.#locator = { host, db, collection }
    // noinspection JSCheckFunctionSignatures
    this.#client = new MongoClient(this.#url, OPTIONS)
  }

  get #url () {
    return process.env.KOO_DEV_MONGODB_URL || `mongodb+srv://${this.#locator.host}`
  }

  async connect () {
    await this.#client.connect()
    this.#collection = this.#client
      .db(this.#locator.db)
      .collection(this.#locator.collection)
  }

  async disconnect () {
    await this.#client.close()
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Client = Client
