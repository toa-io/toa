'use strict'

const { generate } = require('randomstring')
const { Locator } = require('../src/locator')

const regular = {
  domain: generate(),
  name: generate()
}

const nameless = {
  domain: generate()
}

describe('regular', () => {
  const locator = new Locator(regular)
  const host = regular.domain + '-' + regular.name
  const type = generate()

  it('should provide host', () => {
    expect(locator.host()).toStrictEqual(host)
  })

  it('should prepend type', () => {
    expect(locator.host(type)).toStrictEqual(type + '-' + host)
  })

  it('should contain only domain if level 0', () => {
    expect(locator.host(undefined, 0)).toEqual(regular.domain)
    expect(locator.host(type, 0)).toEqual(type + '-' + regular.domain)
  })

  it('should expose uppercase', () => {
    const expected = regular.domain.toUpperCase() + '_' + regular.name.toUpperCase()

    expect(locator.uppercase).toStrictEqual(expected)
  })
})

describe('nameless', () => {
  const locator = new Locator(nameless)
  const host = nameless.domain
  const type = generate()

  it('should provide host', () => {
    expect(locator.host()).toStrictEqual(host)
  })

  it('should prepend type', () => {
    expect(locator.host(type)).toStrictEqual(type + '-' + host)
  })
})
