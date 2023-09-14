'use strict'

const { resolve } = require('node:path')
const { file: { glob } } = require('../../')

it('should be', () => {
  expect(glob).toBeDefined()
})

const root = resolve(__dirname, '.test')

it('should find files', async () => {
  const pattern = resolve(root, 'glob*.txt')
  const expected = ['glob.1.txt', 'glob.2.txt'].map((name) => resolve(root, name))
  const files = await glob(pattern)

  expect(files).toStrictEqual(expected)
})

it('should find files synchronously', async () => {
  const pattern = resolve(root, 'glob*.txt')
  const expected = ['glob.1.txt', 'glob.2.txt'].map((name) => resolve(root, name))
  const files = glob.sync(pattern)

  expect(files).toStrictEqual(expected)
})
