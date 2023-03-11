'use strict'

const { resolve } = require('node:path')
const { file: { glob } } = require('../../')

it('should be', () => {
  expect(glob).toBeDefined()
})

it('should find files', async () => {
  const pattern = resolve(__dirname, 'glob*.txt')
  const expected = ['glob.1.txt', 'glob.2.txt'].map((name) => resolve(__dirname, name))
  const files = await glob(pattern)

  expect(files).toStrictEqual(expected)
})

it('should find files synchronously', async () => {
  const pattern = resolve(__dirname, 'glob*.txt')
  const expected = ['glob.1.txt', 'glob.2.txt'].map((name) => resolve(__dirname, name))
  const files = glob.sync(pattern)

  expect(files).toStrictEqual(expected)
})
