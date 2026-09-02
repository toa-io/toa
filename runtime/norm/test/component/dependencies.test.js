'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const { resolve } = require('node:path')
const { dependencies } = require('../../src/.component')

const NORM = resolve(__dirname, '../../')

it('should be', async () => {
  assert.ok(dependencies instanceof Function)
})

/** @type {toa.norm.Component} */
let component

beforeEach(() => {
  component = /** @type {toa.norm.Component} */ { path: __dirname }
})

for (const [_, reference] of [
  ['package id', '@toa.io/norm'],
  ['relative path', '../../']
])
   describe(`${_}`, () => {
  it('should resolve storage', async () => {
    component.entity = { storage: reference, schema: {} }

    dependencies(component)

    assert.deepStrictEqual(component.entity.storage, NORM)
  })
})

it('should resolve toa packages', async () => {
  component.entity = { storage: '@toa.io/core', schema: {} }

  dependencies(component)

  assert.notStrictEqual(component.entity.storage, undefined)
})
