'use strict'

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

module.exports.operations = [
  {
    name: 'foo',
    invoke: invocation('foo')
  },
  {
    name: 'bar',
    invoke: invocation('bar')
  }
]
