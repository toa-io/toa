'use strict'

const { generate } = require('randomstring')

const { mock } = require('./boot.mock')
jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

it('should be', () => {
  expect(stage.remote).toBeDefined()
})

it('should connect remote', async () => {
  const name = generate()
  const namespace = generate()
  const id = namespace + '.' + name

  const remote = await stage.remote(id)

  expect(mock.boot.remote).toHaveBeenCalled()
  expect(remote).toStrictEqual(await mock.boot.remote.mock.results[0].value)
  expect(remote.connect).toHaveBeenCalled()

  const locator = mock.boot.remote.mock.calls[0][0]

  expect(locator).toBeDefined()
  expect(locator).toMatchObject({ name, namespace })
})
