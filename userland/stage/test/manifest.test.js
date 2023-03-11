'use strict'

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

it('should be', () => {
  expect(stage.manifest).toBeDefined()
})

it('should boot manifest', async () => {
  const path = generate()

  const manifest = await stage.manifest(path)

  expect(mock.boot.manifest).toHaveBeenCalledWith(path)
  expect(manifest).toStrictEqual(await mock.boot.manifest.mock.results[0].value)
})
