'use strict'

const Client = jest.fn().mockImplementation(function () {
  this.connect = jest.fn()
  this.disconnect = jest.fn()
})

const locator = { host: () => 'bar.foo..local', domain: 'foo', entity: 'bar' }

exports.mock = { Client }
exports.locator = locator
