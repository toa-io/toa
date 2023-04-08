'use strict'

const { file: { exists } } = require('../../')
const { resolve } = require('node:path')
const { generate } = require('randomstring')

const FILE = resolve(__dirname, 'read.txt')
const NOT_FILE = resolve(__dirname, generate())

it('should be', () => {
  expect(exists).toBeDefined()
})

it('should return true if file exists', async () => {
  expect(await exists(FILE)).toBe(true)
})

it('should return false if file doesn\'t exists', async () => {
  expect(await exists(NOT_FILE)).toBe(false)
})
