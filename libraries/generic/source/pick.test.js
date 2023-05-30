'use strict'

const { generate } = require('randomstring')

const { pick } = require('../')

it('should be', async () => {
  expect(pick).toBeInstanceOf(Function)
})

it('should pick properties', async () => {
  const source = { a: generate(), b: generate() }
  const output = pick(source, ['b'])

  expect(output).toStrictEqual({ b: source.b })
})
