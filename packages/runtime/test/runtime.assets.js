'use strict'

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

const invocations = [
  {
    name: 'foo',
    invoke: invocation('foo')
  },
  {
    name: 'bar',
    invoke: invocation('bar')
  }
]

exports.invocations = invocations
