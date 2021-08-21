'use strict'

const Client = jest.fn().mockImplementation(function () {
  this.connect = jest.fn()
  this.disconnect = jest.fn()
  this.add = jest.fn(() => true)
  this.get = jest.fn(() => ({ foo: 'bar' }))
  this.update = jest.fn(() => true)
})

const query = {
  criteria: {},
  options: {}
}

const translate = jest.fn(() => ({ criteria: 'foo', options: 'bar' }))

const to = jest.fn((entry) => entry)
const from = jest.fn((entry) => entry)

exports.mock = { Client, translate, to, from }
exports.locator = { host: () => 'bar.foo..local', domain: 'foo', entity: 'bar' }
exports.entry = { id: '1', foo: 'bar' }
exports.query = query
