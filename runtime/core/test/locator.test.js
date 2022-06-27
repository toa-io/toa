'use strict'

const { generate } = require('randomstring')
const { Locator } = require('../src/locator')

const regular = {
  namespace: generate(),
  name: generate()
}

const nameless = {
  namespace: generate()
}

describe('regular', () => {
  const locator = new Locator(regular)
  const host = regular.namespace + '-' + regular.name
  const type = generate()

  it('should provide host', () => {
    expect(locator.host()).toStrictEqual(host)
  })

  it('should prepend type', () => {
    expect(locator.host(type)).toStrictEqual(type + '-' + host)
  })

  it('should contain only namespace if level 0', () => {
    expect(locator.host(undefined, 0)).toEqual(regular.namespace)
    expect(locator.host(type, 0)).toEqual(type + '-' + regular.namespace)
  })

  it('should expose uppercase', () => {
    const expected = regular.namespace.toUpperCase() + '_' + regular.name.toUpperCase()

    expect(locator.uppercase).toStrictEqual(expected)
  })
})

describe('nameless', () => {
  const locator = new Locator(nameless)
  const host = nameless.namespace
  const type = generate()

  it('should provide host', () => {
    expect(locator.host()).toStrictEqual(host)
  })

  it('should prepend type', () => {
    expect(locator.host(type)).toStrictEqual(type + '-' + host)
  })
})
