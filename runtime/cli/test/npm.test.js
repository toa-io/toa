import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { declares } from '../src/handlers/npm.js'

describe('what the workspace already declares', () => {
  it('is the version itself', () => {
    assert.ok(declares({ devDependencies: { cloudinary: '2.11.0' } }, 'cloudinary', '2.11.0'))
  })

  // `npm i -D cloudinary@2.11.0` writes `^2.11.0`, and a second run must find nothing to do
  for (const range of ['^2.11.0', '~2.11.0', '=2.11.0', 'v2.11.0'])
    it(`is a range written around it: ${range}`, () => {
      assert.ok(declares({ dependencies: { cloudinary: range } }, 'cloudinary', '2.11.0'))
    })

  it('is not another version', () => {
    assert.ok(!declares({ devDependencies: { cloudinary: '^2.10.0' } }, 'cloudinary', '2.11.0'))
  })

  it('is not a package it does not name', () => {
    assert.ok(!declares({ devDependencies: {} }, 'cloudinary', '2.11.0'))
  })
})
