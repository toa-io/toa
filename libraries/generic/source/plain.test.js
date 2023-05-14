'use strict'

const { plain } = require('./')

it('should be', async () => {
  expect(plain).toBeInstanceOf(Function)
})

it('should return true for plain objects', async () => {
  const yep = plain({})

  expect(yep).toStrictEqual(true)
})

it('should return false for class instances', async () => {
  class Class {}

  const instance = new Class()
  const nope = plain(instance)

  expect(nope).toStrictEqual(false)
})

it.each([
  ['Array', Array], ['Set', Set], ['Map', Map], ['Uint8Array', Uint8Array], ['null', null],
  ['Number', 1], ['String', 'bar']
])('should return false for %s', async (_, Type) => {
  const instance = Type?.constructor ? Type.constructor() : Type

  const nope = plain(instance)

  expect(nope).toStrictEqual(false)
})
