'use strict'

const { generate } = require('randomstring')
const { Reflection, Connector } = require('../')

it('should export', () => {
  expect(Reflection).toBeDefined()
})

/** @type {toa.core.Reflection<string>} */
let reflection

const value = generate()

/** @type {toa.core.reflection.Source<string>} */
const source = async () => value

beforeEach(() => {
  reflection = new Reflection(source)
})

it('should be a Connector', () => {
  expect(reflection).toBeInstanceOf(Connector)
})

it('should reflect', async () => {
  await reflection.connect()

  expect(reflection.value).toStrictEqual(value)
})
