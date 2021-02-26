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
})
