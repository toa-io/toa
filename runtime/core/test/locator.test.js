'use strict'

const { Locator } = require('../src/locator')

const manifest = {
  domain: 'foo',
  name: 'bar',
  entity: { schema: { foo: 'bar' } },
  operations: { add: { query: false }, get: { output: null } }
}

const nameless = {
  domain: 'foo',
  entity: { schema: { foo: 'bar' } },
  operations: [{ name: 'add' }, { name: 'get' }]
}

it('should provide entity', () => {
  expect(new Locator(manifest).entity).toBe(manifest.entity.schema)
})

it('should provide host', () => {
  expect(new Locator(manifest).host('db')).toBe('bar.foo.db.local')
  expect(new Locator(nameless).host('db')).toBe('foo.db.local')
  expect(new Locator(nameless).host('DB')).toBe('foo.db.local')
})

it('should provide operations', () => {
  expect(new Locator(manifest).operations).toMatchObject(manifest.operations)
})

it('should export', () => {
  expect(new Locator(manifest).export()).toMatchObject(manifest)
})

it('should split', () => {
  expect(Locator.split('foo.bar.do')).toStrictEqual({ domain: 'foo', name: 'bar', endpoint: 'do' })
  expect(Locator.split('foo.bar')).toStrictEqual({ domain: 'foo', name: 'bar', endpoint: undefined })

  expect(Locator.split('foo.bar.do.something.bad'))
    .toStrictEqual({ domain: 'foo', name: 'bar', endpoint: 'do.something.bad' })
})

it('should provide host (static)', () => {
  expect(Locator.host('foo', 'bar', 'amqp')).toBe('bar.foo.amqp.local')
  expect(Locator.host('foo', null, 'amqp')).toBe('foo.amqp.local')
  expect(Locator.host('foo', 'bar')).toBe('bar.foo.local')
  expect(Locator.host('foo')).toBe('foo.local')
})
