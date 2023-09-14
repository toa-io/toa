'use strict'

const { join } = require('node:path')

const { directory: { directories } } = require('../../')

it('should be', async () => {
  expect(directories).toBeInstanceOf(Function)
})

it('should list directories', async () => {
  const path = join(__dirname, '.test')
  const list = await directories(path)
  const expected = ['one', 'two'].map((entry) => join(path, entry))

  expect(list.length).toStrictEqual(expected.length)
  expect(list).toStrictEqual(expect.arrayContaining(expected))
})
