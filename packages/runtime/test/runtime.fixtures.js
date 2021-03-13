'use strict'

const randomstring = require('randomstring')

const { Locator } = require('../src/locator')

const invocation = () => jest.fn(() => randomstring.generate())

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
