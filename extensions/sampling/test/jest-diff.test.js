'use strict'

const { diff } = require('jest-diff')

it('should accept [expected, received] arguments', async () => {
  const a = { a: 1 }
  const b = { b: 2 }
  const d = diff(a, b)

  expect(d).toStrictEqual(expect.stringContaining('-   "a": 1'))
  expect(d).toStrictEqual(expect.stringContaining('+   "b": 2'))
})
