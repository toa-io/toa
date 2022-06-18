'use strict'

const { annotations } = require('../')

it('should must be a function', () => {
  expect(annotations).toBeDefined()
  expect(annotations).toBeInstanceOf(Function)
})

it('should pass if hostname', () => {
  const host = 'toa.io'
  expect(annotations(host)).toStrictEqual(host)
})

it('should throw if not hostname', () => {
  expect(() => annotations('[]')).toThrow(TypeError)
  // noinspection JSCheckFunctionSignatures
  expect(() => annotations({ foo: 'bar' })).toThrow(TypeError)
})
