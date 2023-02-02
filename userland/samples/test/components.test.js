'use strict'

const { generate } = require('randomstring')

const { suite } = require('./suite.mock')
const { replay } = require('./replay.mock')
const mock = { suite, replay }

jest.mock('../src/suite', () => mock.suite)
jest.mock('../src/replay', () => mock.replay)

const { components } = require('../')

it('should be', () => {
  expect(components).toBeDefined()
})

const paths = [generate()]

/** @type {boolean} */
let result

beforeAll(async () => {
  result = await components(paths)
})

it('should load suite', async () => {
  expect(mock.suite.components).toHaveBeenCalledWith(paths)
})

it('should replay suite', async () => {
  const suite = await mock.suite.components.mock.results[0].value

  expect(mock.replay.replay).toHaveBeenCalledWith(suite, paths)
})

it('should return result', async () => {
  expect(result).toStrictEqual(await mock.replay.replay.mock.results[0].value)
})
