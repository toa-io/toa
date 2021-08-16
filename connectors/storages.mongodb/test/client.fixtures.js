'use strict'

const MongoClient = jest.fn().mockImplementation(function () {
  this.db = jest.fn(() => new DB())

  this.connect = jest.fn()
  this.close = jest.fn()
})

const DB = jest.fn().mockImplementation(function () {
  this.collection = jest.fn(() => new Collection())
})

const Collection = jest.fn().mockImplementation(function () {
  this.find = jest.fn()
  this.findOne = jest.fn()
  this.insertOne = jest.fn()
  this.findOneAndReplace = jest.fn()
})

const OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ignoreUndefined: true
}

exports.mock = { MongoClient }
exports.OPTIONS = OPTIONS
exports.locator = { host: 'bar.foo', db: 'foo', collection: 'bar' }
