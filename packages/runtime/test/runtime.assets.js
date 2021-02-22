import { jest } from '@jest/globals'

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

export const operations = [
  {
    name: 'foo',
    invoke: invocation('foo')
  },
  {
    name: 'bar',
    invoke: invocation('bar')
  }
]
