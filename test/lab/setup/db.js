'use strict'

const { MongoMemoryServer } = require('mongodb-memory-server')
const { MongoClient } = require('mongodb')

let mongod, client

const KOO_DEV_MONGODB_URL = process.env.KOO_DEV_MONGODB_URL

const setup = async () => {
  mongod = await MongoMemoryServer.create()

  const uri = mongod.getUri()

  process.env.KOO_DEV_MONGODB_URL = uri

  client = new MongoClient(uri, OPTIONS)
  await client.connect()

  return client
}

const teardown = async () => {
  await client.close()
  await mongod.stop()

  process.env.KOO_DEV_MONGODB_URL = KOO_DEV_MONGODB_URL
}

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.setup = setup
exports.teardown = teardown
