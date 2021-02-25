'use strict'

const invocation = (name) => {
  return jest.fn((io) => new Promise(resolve => {
    io.output.called = name
    resolve()
  }))
}

const invocations = {
  foo: {
    invoke: invocation('foo')
  },
  bar: {
    invoke: invocation('bar')
  }
}

exports.invocations = invocations
