'use strict'

const { freeze } = require('../src/freeze')

it('should freeze', () => {
  const object = { foo: 'bar' }

  freeze(object)

  expect(() => (object.foo = 'baz')).toThrow(/read only property/)
  expect(() => (object.bar = 'foo')).toThrow(/not extensible/)
})

it('should deep freeze', () => {
  const object = { foo: { bar: 'baz ' } }

  freeze(object)

  expect(() => (object.foo.bar = 'foo')).toThrow(/read only property/)
  expect(() => (object.foo.baz = 'foo')).toThrow(/not extensible/)
})

it('should not throw on null or undefined', () => {
  expect(() => freeze(null)).not.toThrow()
  expect(() => freeze(undefined)).not.toThrow()
})
