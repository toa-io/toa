'use strict'

const randomstring = require('randomstring')

const invocation = () => jest.fn(() => randomstring.generate())

const invocations = {
  foo: {
    invoke: invocation('foo')
  },
  bar: {
    invoke: invocation('bar')
  }
}

const locator = {}

exports.invocations = invocations
exports.locator = locator
