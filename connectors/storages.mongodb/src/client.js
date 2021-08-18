'use strict'

const { MongoClient } = require('mongodb')

class Client {
  #connection

  #client
  #collection

  constructor (host, db, collection) {
    this.#connection = { host, db, collection }
    this.#client = new MongoClient(this.#uri, OPTIONS)
  }

  get #uri () {
    return process.env.KOO_DEV_MONGODB_URL || `mongodb+srv://${this.#connection.host}`
  }

  async connect () {
    await this.#client.connect()

    this.#collection = this.#client
      .db(this.#connection.db)
      .collection(this.#connection.collection)
  }

  async disconnect () {
    await this.#client.close()
  }

  async add (object) {
    const { acknowledged } = await this.#collection.insertOne(object)

    return { ok: acknowledged }
  }
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.Client = Client
