'use strict'

const { random, repeat, newid } = require('@toa.io/gears')

const mock = {
  image: {
    Image: jest.fn(() => {
      return {
        build: jest.fn(),
        push: jest.fn()
      }
    })
  }
}

const context = {
  name: 'context-' + newid(),
  registry: `registry-${newid()}:${random(999) + 5000}`,
  manifests: repeat(
    () => ({
      domain: 'domain-' + newid(),
      name: 'component-' + newid(),
      version: '0.0.0'
    }),
    random(9) + 1)
}

exports.mock = mock
exports.context = context
