'use strict'

const { generate } = require('randomstring')

const { mock } = require('./boot.mock')
jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

it('should be', () => {
  expect(stage.composition).toBeDefined()
})

it('should boot composition', async () => {
  const paths = [generate(), generate()]

  await stage.composition(paths)

  expect(mock.boot.composition).toHaveBeenCalledWith(paths)

  const composition = await mock.boot.composition.mock.results[0].value

  expect(composition.connect).toHaveBeenCalled()
})
