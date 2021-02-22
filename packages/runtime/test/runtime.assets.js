import { jest } from '@jest/globals'

const assets = {}

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

assets.operations = [
  {
    name: 'foo',
    invoke: invocation('foo')
  },
  {
    name: 'bar',
    invoke: invocation('bar')
  }
]

export default assets
