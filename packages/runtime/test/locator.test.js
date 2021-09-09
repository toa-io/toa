'use strict'

const { Locator } = require('../src/locator')

it('should provide host', () => {
  expect(new Locator('foo', 'bar').host('db')).toBe('bar.foo.db.local')
  expect(new Locator('foo').host('db')).toBe('foo.db.local')
  expect(new Locator('foo').host('DB')).toBe('foo.db.local')
})

it('should format endpoint', () => {
  expect(new Locator('foo', 'bar').endpoint('do')).toBe('foo.bar.do')
  expect(new Locator('foo').endpoint('do')).toBe('foo.do')
})

it('should provide endpoints', () => {
  const endpoints = [1, 2, 3]
  const locator = new Locator('foo', 'bar', endpoints)

  expect(locator.endpoints).toStrictEqual(endpoints)
})

it('should split', () => {
  expect(Locator.split('foo.bar.do')).toStrictEqual({ domain: 'foo', name: 'bar', endpoint: 'do' })
  expect(Locator.split('foo.bar')).toStrictEqual({ domain: 'foo', name: 'bar', endpoint: undefined })
})

it('should provide host (static)', () => {
  expect(Locator.host('foo', 'bar', 'amqp')).toBe('bar.foo.amqp.local')
  expect(Locator.host('foo', null, 'amqp')).toBe('foo.amqp.local')
  expect(Locator.host('foo', 'bar')).toBe('bar.foo.local')
  expect(Locator.host('foo')).toBe('foo.local')
})
