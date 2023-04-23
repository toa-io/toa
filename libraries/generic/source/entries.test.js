'use strict'

const { generate } = require('randomstring')

const { entries } = require('../')

it('should be', async () => {
  expect(entries).toBeInstanceOf(Function)
})

it('should return entries', async () => {
  const object = { [generate()]: generate() }
  const expected = Object.entries(object)
  const output = entries(object)

  expect(output).toStrictEqual(expected)
})

it('should return symbols', async () => {
  const sym = Symbol('test')
  const value = generate()
  const key = generate()
  const object = { [key]: generate(), [sym]: value }
  const output = entries(object)

  expect(output).toStrictEqual([[key, object[key]], [sym, value]])
})
