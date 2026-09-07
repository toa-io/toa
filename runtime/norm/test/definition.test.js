import { it } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'

import { definition } from '../src/definition.js'

it('reads a definition.js where a package ships one', async () => {
  const { name, module } = await definition(join(import.meta.dirname, 'dummies/defined'))

  assert.equal(name, 'dummies.defined')
  assert.equal(module.declares, true)
  assert.equal(module.runs, undefined)
})

it('reads the entry where a package ships no definition.js', async () => {
  const path = join(import.meta.dirname, '../')
  const { name, module } = await definition(path)

  assert.equal(name, '@toa.io/norm')
  assert.ok(module.context instanceof Function)
})

it('names a directory without package.json by its reference', async () => {
  const path = join(import.meta.dirname, 'dummies/bare')
  const { name, module } = await definition(path)

  assert.equal(name, path)
  assert.equal(module.declares, true)
})

it('loads a definition once', async () => {
  const path = join(import.meta.dirname, 'dummies/bare')

  assert.equal(await definition(path), await definition(path))
})
