'use strict'

const { Readable } = require('node:stream')
const { generate } = require('randomstring')

const { buffer } = require('../')

it('should be', async () => {
  expect(buffer).toBeInstanceOf(Function)
})

it('should buffer', async () => {
  const input = Buffer.from(generate())
  const stream = Readable.from(input)
  const output = await buffer(stream)

  expect(output).toStrictEqual(input)
})
