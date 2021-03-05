'use strict'

const connector = (name) => ({ name, bind: jest.fn(), depends: jest.fn() })

const mock = {
  '@kookaburra/package': {
    Package: {
      load: jest.fn((dir) => components.find(component => component.name === dir))
    }
  },
  '@kookaburra/runtime': {
    Connector: jest.fn().mockImplementation(() => connector('connector'))
  },
  http: {
    http: jest.fn(() => connector('http'))
  },
  runtime: {
    runtime: jest.fn(name => connector(`runtime-${name}`))
  }
}

const dirs = ['foo', 'bar']
const components = dirs.map(dir => ({ name: dir, operations: [] }))

const options = { http: { port: 8080 } }

exports.dirs = dirs
exports.components = components
exports.mock = mock
exports.options = options
