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

const env = process.env.TOA_ENV

beforeAll(() => {
  delete process.env.TOA_ENV
})

afterAll(() => {
  process.env.TOA_ENV = env
})

it('should provide host', () => {
  expect(new Locator(manifest).host('db')).toBe('foo-db')
  expect(new Locator(nameless).host('db')).toBe('foo-db')
  expect(new Locator(nameless).host('DB')).toBe('foo-db')
  expect(new Locator(manifest).host('db', 1)).toBe('foo-bar-db')
  expect(new Locator(nameless).host('db', 1)).toBe('foo-db')
})
