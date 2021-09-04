'use strict'

const randomstring = require('randomstring')

const bridges = {
  transition: {
    run: jest.fn(() => ([{ [randomstring.generate()]: randomstring.generate() }, null])),
    type: 'transition'
  },
  observation: {
    run: jest.fn(() => ({ [randomstring.generate()]: randomstring.generate() })),
    type: 'observation'
  },
  error: {
    run: jest.fn(() => [{}, { [randomstring.generate()]: randomstring.generate() }]),
    type: 'transition'
  }
}

const target = {
  query: jest.fn(() => ({
    get: jest.fn(() => ({ foo: randomstring.generate() })),
    set: jest.fn()
  })),
  commit: jest.fn()
}

const query = randomstring.generate()

exports.bridges = bridges
exports.target = target
exports.query = query
exports.input = { foo: 'bar' }
