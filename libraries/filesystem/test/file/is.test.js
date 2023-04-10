'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')
const { file: { is } } = require('../../')

it('should be', () => {
  expect(is).toBeDefined()
})

it('should return true if file exists', async () => {
  const file = join(__dirname, 'read.txt')

  expect(await is(file)).toBe(true)
})

it('should return false if path doesn\'t exists', async () => {
  const path = join(__dirname, generate())

  expect(await is(path)).toBe(false)
})

it('should return false if path isn\'t a file', async () => {
  expect(await is(__dirname)).toBe(false)
})
