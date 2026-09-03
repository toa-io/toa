import { mock } from 'node:test'

import randomstring from 'randomstring'

const invocation = () => mock.fn(() => randomstring.generate())

export const invocations = {
  foo: {
    invoke: invocation('foo'),
    link: () => null
  },
  bar: {
    invoke: invocation('bar'),
    link: () => null
  }
}

export const locator = {}
