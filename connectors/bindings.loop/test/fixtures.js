'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const component = {
  locator: {
    id: 'foo.bar',
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
  invoke: mock.fn(async () => generate()),
  link: () => null,
  connect: () => null,
  disconnect: () => null
}

const endpoints = ['get', 'add', 'discover']

const exposition = {
  locator: {
    id: 'foo.bar'
  },
  invoke: mock.fn(async () => generate())
}

exports.component = component
exports.endpoints = endpoints
exports.exposition = exposition
