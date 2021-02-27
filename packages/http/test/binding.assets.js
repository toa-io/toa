'use strict'

const string = require('randomstring')

const server = {
  bind: jest.fn(),
  listen: jest.fn(),
  close: jest.fn()
}

const runtime = {
  locator: {
    name: string.generate()
  }
}

const matrix = {
  type: ['observation', 'transition'],
  state: ['object', 'collection', undefined]
}

const operations = {}
const keys = Object.keys(matrix)
const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())))

cartesian(...Object.entries(matrix).map(([, v]) => v)).forEach(values => {
  const key = string.generate()
  const operation = (operations[key] = { name: key })

  values.forEach((value, i) => (operation[keys[i]] = values[i]))
})

exports.mock = {
  verb: jest.fn(() => string.generate()),
  route: jest.fn(() => string.generate())
}

exports.server = server
exports.runtime = runtime
exports.operations = operations
