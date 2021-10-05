'use strict'

const { generate } = require('randomstring')

const cascade = {
  run: jest.fn(() => ({ output: generate() }))
}

const subject = {
  query: jest.fn((query) => {
    if (query?.mock === null) return null

    return {
      get: jest.fn(() => ({ foo: generate() })),
      set: jest.fn()
    }
  }),
  init: jest.fn(() => ({
    get: jest.fn(() => ({ foo: generate() })),
    set: jest.fn()
  })),
  commit: jest.fn()
}

const contract = {
  fit: jest.fn((input) => input.invalid ? { [generate()]: generate() } : undefined)
}

const query = {
  parse: jest.fn((query) => query)
}

const mock = class {
  preprocess (request) {
    return {
      request,
      subject: { [generate()]: generate() },
      state: { [generate()]: generate() }
    }
  }
}

exports.cascade = cascade
exports.subject = subject
exports.contract = contract
exports.query = query
exports.mock = mock
exports.request = { input: generate(), query: generate() }
