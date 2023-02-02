'use strict'

const { generate } = require('randomstring')
const { join } = require('node:path')
const { is } = require('../../src/directory')

it('should be', async () => {
  expect(is).toBeDefined()
})

it('should return false if path does not exists', async () => {
  const path = join(__dirname, generate())

  expect(await is(path)).toStrictEqual(false)
})
