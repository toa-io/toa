'use strict'

const randomstring = require('randomstring')

const bridges = {
  transition: {
    run: jest.fn(),
    type: 'transition'
  },
  observation: {
    run: jest.fn(),
    type: 'observation'
  }
}

const target = {
  query: jest.fn(() => ({ state: { foo: randomstring.generate() } })),
  commit: jest.fn()
}

const query = randomstring.generate()

exports.bridges = bridges
exports.target = target
exports.query = query
exports.io = {}
