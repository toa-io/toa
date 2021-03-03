'use strict'

const string = require('randomstring')

const conflict = require('./binding.conflict.fixtures')

const server = {
  bind: jest.fn(),
  listen: jest.fn(),
  close: jest.fn()
}

const runtime = {
  locator: {
    name: string.generate(),
    path: string.generate(),
    endpoint: () => string.generate()
  }
}

const matrix = {
  type: ['observation', 'transition'],
  state: ['object', 'collection', undefined]
}

const keys = Object.keys(matrix)
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))
const operation = values => ({
  name: string.generate(),
  http: [{ path: string.generate() }],
  ...Object.fromEntries(values.map((value, i) => ([keys[i], values[i]])))
})

const operations = cartesian(...Object.entries(matrix).map(([, v]) => v)).map(operation)

exports.mock = {
  verb: jest.fn(() => string.generate()),
  route: jest.fn(() => string.generate())
}

exports.server = server
exports.runtime = runtime
exports.operations = operations
exports.conflict = conflict
