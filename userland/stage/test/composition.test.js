'use strict'

const { generate } = require('randomstring')

const mock = {
  boot: require('./boot.mock')
}

jest.mock('@toa.io/boot', () => mock.boot)

const stage = require('../')

const paths = [generate(), generate()]

it('should be', () => {
  expect(stage.composition).toBeDefined()
})

it('should boot composition', async () => {
  await stage.composition(paths)

  expect(mock.boot.composition.mock.calls[0][0]).toStrictEqual(paths)

  const composition = await mock.boot.composition.mock.results[0].value

  expect(composition.connect).toHaveBeenCalled()
})
