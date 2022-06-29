'use strict'

const { annotation } = require('../')

it('should must be a function', () => {
  expect(annotation).toBeDefined()
  expect(annotation).toBeInstanceOf(Function)
})

it('should pass if hostname', () => {
  const host = 'toa.io'
  expect(annotation(host)).toStrictEqual(host)
})

it('should throw if not hostname', () => {
  expect(() => annotation('[]')).toThrow(TypeError)
  // noinspection JSCheckFunctionSignatures
  expect(() => annotation({ foo: 'bar' })).toThrow(TypeError)
})
