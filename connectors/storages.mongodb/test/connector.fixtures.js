'use strict'

const Client = jest.fn().mockImplementation(function () {
  this.connect = jest.fn()
  this.disconnect = jest.fn()
  this.add = jest.fn(() => 1)
  this.get = jest.fn(() => ({ foo: 'bar' }))
  this.update = jest.fn(() => ({ foo: 'bar' }))
})

const query = {
  criteria: {},
  options: {}
}

const translate = jest.fn(() => ({ criteria: 'foo', options: 'bar' }))

exports.mock = { Client, translate }
exports.locator = { host: () => 'bar.foo..local', domain: 'foo', entity: 'bar' }
exports.entry = { _id: '1', foo: 'bar' }
exports.query = query
