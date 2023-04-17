'use strict'

const { join } = require('node:path')
const { load } = require('../../src/.context/.dependencies/load')

it('should be', async () => {
  expect(load).toBeInstanceOf(Function)
})

it('should load module', async () => {
  const path = join(__dirname, '../../')
  const { metadata, module } = load(path)

  expect(metadata.name).toStrictEqual('@toa.io/norm')
  expect(module.context).toBeInstanceOf(Function)
})

it('should return null metadata if no package.json', async () => {
  const path = join(__dirname, '../../src')
  const { metadata, module } = load(path)

  expect(metadata).toBeNull()
  expect(module.context).toBeInstanceOf(Function)
})
