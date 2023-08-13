'use strict'

const { resolve } = require('node:path')
const { pkg } = require('./')

it('should be', async () => {
  expect(pkg).toBeInstanceOf(Function)
})

it('should return package root', async () => {
  const path = pkg('@toa.io/filesystem')
  const expected = resolve(__dirname, '../../')

  expect(path).toStrictEqual(expected)
})

it('should return path within package', async () => {
  const path = pkg('@toa.io/filesystem', 'source/directory/pkg.test.js')

  expect(path).toStrictEqual(__filename)
})
