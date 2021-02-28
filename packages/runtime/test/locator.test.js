'use strict'

const { Locator } = require('../src/locator')

describe('name', () => {
  it('should provide conventional name', () => {
    const locator = new Locator()

    locator.domain = 'foo'
    locator.forename = 'bar'

    expect(locator.name).toBe('foo.bar')
  })

  it('should provide simple name', () => {
    const locator = new Locator()

    locator.forename = 'bar'

    expect(locator.name).toBe('bar')
  })

  it('should provide endpoints', () => {
    const locator = new Locator()

    locator.forename = 'foo'

    expect(locator.endpoint('bar')).toBe('foo.bar')
  })

  it('should provide path', () => {
    const simple = new Locator()
    const full = new Locator()

    simple.forename = full.forename = 'bar'
    full.domain = 'baz'

    expect(simple.path).toBe('/bar')
    expect(full.path).toBe('/baz/bar')
  })
})
