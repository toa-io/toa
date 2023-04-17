'use strict'

const { resolve } = require('node:path')
const { dependencies } = require('../../src/.component')

const NORM = resolve(__dirname, '../../')

it('should be', async () => {
  expect(dependencies).toBeInstanceOf(Function)
})

/** @type {toa.norm.Component} */
let component

beforeEach(() => {
  component = /** @type {toa.norm.Component} */ { path: __dirname }
})

describe.each(/** @type {[string, string][]} */ [
  ['package id', '@toa.io/norm'],
  ['relative path', '../../']
])('%s', (_, reference) => {
  it('should resolve storage', async () => {
    component.entity = { storage: reference, schema: {} }

    dependencies(component)

    expect(component.entity.storage).toStrictEqual(NORM)
  })
})

it('should resolve toa packages', async () => {
  component.entity = { storage: '@toa.io/core', schema: {} }

  dependencies(component)

  expect(component.entity.storage).toBeDefined()
})
