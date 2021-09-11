'use strict'

const { generate } = require('randomstring')

const runtime = {
  locator: {
    fqn: 'foo.bar',
    operations: [
      {
        name: 'get'
      },
      {
        name: 'add'
      },
      {
        name: 'discover'
      }
    ]
  },
  invoke: jest.fn(async () => generate())
}

const endpoints = ['get', 'add', 'discover']

const exposition = {
  locator: {
    fqn: 'foo.bar'
  },
  invoke: jest.fn(async () => generate())
}

exports.runtime = runtime
exports.endpoints = endpoints
exports.exposition = exposition
