'use strict'

const { generate } = require('randomstring')

const bridges = {
  transition: {
    run: jest.fn(() => ({ output: generate() })),
    type: 'transition'
  },
  observation: {
    run: jest.fn(() => ({ output: generate() })),
    type: 'observation'
  },
  error: {
    run: jest.fn(() => ({ error: generate() })),
    type: 'transition'
  }
}

const target = {
  query: jest.fn(() => ({
    get: jest.fn(() => ({ foo: generate() })),
    set: jest.fn()
  })),
  commit: jest.fn()
}

const contract = {
  fit: jest.fn((input) => input.invalid ? { [generate()]: generate() } : undefined)
}

exports.bridges = bridges
exports.target = target
exports.contract = contract
exports.request = { input: generate(), query: generate() }
