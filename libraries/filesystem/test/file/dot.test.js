'use strict'

const { resolve } = require('node:path')

const { file: { dot } } = require('../../')

it('should be', async () => {
  expect(dot).toBeInstanceOf(Function)
})

let cwd

beforeAll(() => {
  cwd = process.cwd()

  process.chdir(__dirname)
})

afterAll(() => {
  process.chdir(cwd)
})

it('should find dot-file', async () => {
  const expected = resolve('../.test')
  const output = await dot('test')

  expect(output).toStrictEqual(expected)
})

it('should return undefined if not found', async () => {
  const output = await dot('test1')

  expect(output).toBeUndefined()
})
