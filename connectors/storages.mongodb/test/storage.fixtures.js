'use strict'

const Client = jest.fn().mockImplementation(function () {
  this.connect = jest.fn()
  this.disconnect = jest.fn()
  this.add = jest.fn(() => true)
  this.get = jest.fn(() => ({ foo: 'bar' }))
  this.update = jest.fn(() => ({ ok: 1 }))
  this.find = jest.fn(() => [{ foo: 'bar' }, { bar: 'foo' }])
})

const query = {
  criteria: {},
  options: {}
}

const translate = jest.fn(() => ({ criteria: 'foo', options: 'bar' }))

const to = jest.fn((entry) => entry)
const from = jest.fn((entry) => entry)

exports.mock = { Client, translate, to, from }
exports.locator = { host: jest.fn(() => 'bar.foo.local'), domain: 'foo', name: 'bar' }
exports.entry = { id: '1', foo: 'bar' }
exports.query = query
