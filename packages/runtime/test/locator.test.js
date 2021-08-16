'use strict'

const { Locator } = require('../src/locator')

describe('name', () => {
  it('should throw if domain is undefined', () => {
    expect(() => new Locator()).toThrow(/must be defined/)
    expect(() => new Locator('foo')).not.toThrow(/must be defined/)
  })

  it('should provide host', () => {
    expect(new Locator('foo', 'bar').host('db')).toBe('bar.foo.db.local')
    expect(new Locator('foo').host('db')).toBe('foo.db.local')
    expect(new Locator('foo').host('DB')).toBe('foo.db.local')
  })

  // it('should provide conventional name', () => {
  //   const locator = new Locator(domain, name)
  //
  //   expect(locator.name).toBe(concat(domain, '.', name))
  // })
  //
  // it('should provide endpoints', () => {
  //   const locator = new Locator()
  //
  //   locator.forename = 'foo'
  //
  //   expect(locator.endpoint('bar')).toBe('foo.bar')
  // })
  //
  // it('should provide path', () => {
  //   const simple = new Locator()
  //   const full = new Locator()
  //
  //   simple.forename = full.forename = 'bar'
  //   full.domain = 'baz'
  //
  //   expect(simple.path).toBe('/bar')
  //   expect(full.path).toBe('/baz/bar')
  // })
})
