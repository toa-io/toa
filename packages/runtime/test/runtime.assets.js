'use strict'

const { Locator } = require('../src/locator')

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

const invocations = {
  foo: {
    invoke: invocation('foo')
  },
  bar: {
    invoke: invocation('bar')
  }
}

const locator = Object.assign(new Locator(), { domain: 'foo', forename: 'bar' })

exports.invocations = invocations
exports.locator = locator
