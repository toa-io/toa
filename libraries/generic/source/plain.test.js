'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { plain } = require('./')

it('should be', async () => {
  assert.ok(plain instanceof Function)
})

it('should return true for plain objects', async () => {
  const yep = plain({})

  assert.deepStrictEqual(yep, true)
})

it('should return false for class instances', async () => {
  class Class {}

  const instance = new Class()
  const nope = plain(instance)

  assert.deepStrictEqual(nope, false)
})

for (const [_, Type] of [
  ['Array', Array], ['Set', Set], ['Map', Map], ['Uint8Array', Uint8Array], ['null', null],
  ['Number', 1], ['String', 'bar']
])
   it(`should return false for ${_}`, async () => {
  const instance = Type?.constructor ? Type.constructor() : Type

  const nope = plain(instance)

  assert.deepStrictEqual(nope, false)
})
