'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { join } = require('node:path')
const { load } = require('../../src/.context/.dependencies/load')

it('should be', async () => {
  assert.ok(load instanceof Function)
})

it('should load module', async () => {
  const path = join(__dirname, '../../')
  const { metadata, module } = load(path)

  assert.deepStrictEqual(metadata.name, '@toa.io/norm')
  assert.ok(module.context instanceof Function)
})

it('should return null metadata if no package.json', async () => {
  const path = join(__dirname, '../../src')
  const { metadata, module } = load(path)

  assert.strictEqual(metadata, null)
  assert.ok(module.context instanceof Function)
})
