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

it('should provide host', () => {
  expect(new Locator(manifest).host('db')).toBe('bar.foo.db.local')
  expect(new Locator(nameless).host('db')).toBe('foo.db.local')
  expect(new Locator(nameless).host('DB')).toBe('foo.db.local')
})
