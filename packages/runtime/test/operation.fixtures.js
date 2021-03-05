'use strict'

const randomstring = require('randomstring')

const operations = {
  transition: {
    algorithm: jest.fn(),
    type: 'transition'
  },
  observation: {
    algorithm: jest.fn(),
    type: 'observation'
  }
}

const target = {
  query: jest.fn(() => ({ foo: randomstring.generate() })),
  persist: jest.fn()
}

const query = randomstring.generate()

exports.operations = operations
exports.target = target
exports.query = query
exports.io = {}
