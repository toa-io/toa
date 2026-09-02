import { it } from 'node:test'
import assert from 'node:assert/strict'

import { join } from 'node:path'
import { load } from '../../src/.context/.dependencies/load.js'

it('should be', async () => {
  assert.ok(load instanceof Function)
})

it('should load module', async () => {
  const path = join(import.meta.dirname, '../../')
  const { metadata, module } = await load(path)

  assert.deepStrictEqual(metadata.name, '@toa.io/norm')
  assert.ok(module.context instanceof Function)
})

it('should return null metadata if no package.json', async () => {
  const path = join(import.meta.dirname, '../../src')
  const { metadata, module } = await load(path)

  assert.strictEqual(metadata, null)
  assert.ok(module.context instanceof Function)
})
