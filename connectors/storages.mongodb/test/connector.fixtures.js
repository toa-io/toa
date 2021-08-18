'use strict'

const Client = jest.fn().mockImplementation(function () {
  this.connect = jest.fn()
  this.disconnect = jest.fn()
  this.add = jest.fn(() => 1)
})

exports.mock = { Client }
exports.locator = { host: () => 'bar.foo..local', domain: 'foo', entity: 'bar' }
exports.object = { _id: '1', foo: 'bar' }
