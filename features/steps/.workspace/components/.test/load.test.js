import { it } from 'node:test'
import assert from 'node:assert/strict'

import { load } from '../load.js'

it('should be', () => {
  assert.notStrictEqual(load, undefined)
})

it('should load', async () => {
  const id = 'dummies.one'
  const component = await load(id)

  assert.deepStrictEqual(component.locator.id, id)
})
