'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { load } = require('../load')

it('should be', () => {
  assert.notStrictEqual(load, undefined)
})

it('should load', async () => {
  const id = 'dummies.one'
  const component = await load(id)

  assert.deepStrictEqual(component.locator.id, id)
})
