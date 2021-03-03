'use strict'

const connector = (name) => ({ name, bind: jest.fn(), depends: jest.fn() })

class Package {
  static load (dir) {
    return components.find(component => component.name === dir)
  }
}

const mock = {
  '@kookaburra/package': {
    Package
  },
  '@kookaburra/runtime': {
    Connector: jest.fn().mockImplementation(() => ({ depends: jest.fn() }))
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
