'use strict'

const MongoClient = jest.fn().mockImplementation(function () {
  this.db = jest.fn(() => new DB())

  this.connect = jest.fn()
  this.close = jest.fn()
})

const DB = jest.fn().mockImplementation(function () {
  this.collection = jest.fn(() => new Collection())
})

const results = {
  insertOne: { acknowledged: 1 }
}

const Collection = jest.fn().mockImplementation(function () {
  this.find = jest.fn()
  this.findOne = jest.fn(() => ({ _id: 1, foo: 'bar' }))
  this.insertOne = jest.fn(() => results.insertOne)
  this.findOneAndReplace = jest.fn(() => ({ ok: 1 }))
})

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

const get = {}

get.query = {
  criteria: {
    _id: 1
  }
}

exports.mock = { MongoClient }
exports.OPTIONS = OPTIONS
exports.locator = { host: 'bar.foo', db: 'foo', collection: 'bar' }
exports.object = { _id: '1', foo: 'bar' }
exports.get = get
