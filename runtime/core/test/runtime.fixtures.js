'use strict'

const randomstring = require('randomstring')

const invocation = () => jest.fn(() => randomstring.generate())

const invocations = {
  foo: {
    invoke: invocation('foo'),
    link: () => null
  },
  bar: {
    invoke: invocation('bar'),
    link: () => null
  }
}

const locator = {}

exports.invocations = invocations
exports.locator = locator
