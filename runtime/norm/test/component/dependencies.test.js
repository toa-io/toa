import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from 'node:path'
import { dependencies } from '../../src/.component/index.js'

const NORM = resolve(import.meta.dirname, '../../')

it('should be', async () => {
  assert.ok(dependencies instanceof Function)
})

/** @type {toa.norm.Component} */
let component

beforeEach(() => {
  component = /** @type {toa.norm.Component} */ { path: import.meta.dirname }
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
