'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { recognize } = require('../src/lookup')
const fixtures = require('./lookup.fixtures')

let object

beforeEach(() => {
  object = clone(fixtures.object)
})

it('should not change unknown', () => {
  recognize(object)

  expect(object).toStrictEqual(fixtures.object)
})

it('should resolve known', () => {
  const known = append()

  recognize(object)

  for (const [alias, name] of Object.entries(fixtures.KNOWN)) {
    expect(object[alias]).toBeUndefined()
    expect(object[name]).toStrictEqual(known[name])
  }
})

it('should group known', () => {
  const known = append()
  const group = generate()

  recognize(object, group)

  expect(object[group]).toStrictEqual(known)

  for (const alias of Object.keys(fixtures.KNOWN)) expect(object[alias]).toBeUndefined()
})

it('should not overwrite group', () => {
  append()
  const group = generate()
  const existing = { [generate()]: generate() }

  object[group] = clone(existing)

  recognize(object, group)

  expect(object[group]).toStrictEqual(expect.objectContaining(existing))
})

it('should not create empty group', () => {
  const group = generate()

  recognize(object, group)

  expect(object[group]).toBeUndefined()
})

const append = () => {
  const known = {}

  for (const [alias, name] of Object.entries(fixtures.KNOWN)) {
    const value = { [generate()]: generate() }

    object[alias] = clone(value)
    known[name] = clone(value)
  }

  return known
}
