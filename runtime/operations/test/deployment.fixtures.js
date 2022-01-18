'use strict'

const { generate } = require('randomstring')

const context = {
  name: generate(),
  description: generate(),
  version: '0.0.1',
  runtime: '0.1.0',
  packages: './path/to/' + generate()
}

const mock = {
  dependencies: {
    dependencies: jest.fn(() => [generate(), generate()])
  },
  directory: {
    directory: jest.fn(() => generate())
  },
  chart: {
    chart: jest.fn(() => ({ [generate()]: generate() }))
  },
  values: {
    values: jest.fn(() => ({ [generate()]: generate() }))
  },
  fs: {
    writeFile: jest.fn(),
    rm: jest.fn()
  },
  execa: jest.fn(() => ({ stdout: { pipe: jest.fn() } }))
}

exports.context = context
exports.mock = mock
