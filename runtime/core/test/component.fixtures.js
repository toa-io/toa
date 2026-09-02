'use strict'

const { mock } = require('node:test')

const randomstring = require('randomstring')

const invocation = () => mock.fn(() => randomstring.generate())

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
