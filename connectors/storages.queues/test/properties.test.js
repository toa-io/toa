'use strict'

const { generate } = require('randomstring')
const { normalize } = require('../source/properties')

it('should be', async () => {
  expect(normalize).toBeInstanceOf(Function)
})

it('should return properties', async () => {
  /** @type {toa.queues.Properties} */
  const input = { exchange: generate() }
  const output = normalize(input)

  expect(output).toStrictEqual(input)
})

it('should set exchange if string given', async () => {
  const input = generate()
  const output = normalize(input)

  expect(output.exchange).toStrictEqual(input)
})
