'use strict'

const { Locator } = require('../src/locator')

describe('name', () => {
  it('should provide host', () => {
    expect(new Locator('foo', 'bar').host('db')).toBe('bar.foo.db.local')
    expect(new Locator('foo').host('db')).toBe('foo.db.local')
    expect(new Locator('foo').host('DB')).toBe('foo.db.local')
  })

  it('should provide endpoints', () => {
    const endpoints = [1, 2, 3]
    const locator = new Locator('foo', 'bar', endpoints)

    expect(locator.endpoints).toStrictEqual(endpoints)
  })
})
