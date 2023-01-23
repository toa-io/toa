'use strict'

const { resolve } = require('node:path')

const { stage } = require('./stage.mock')
const { suite } = require('./suite.mock')
const { replay } = require('./replay.mock')
const mock = { stage, suite, replay }

jest.mock('@toa.io/userland/stage', () => mock.stage)
jest.mock('../src/suite', () => mock.suite)
jest.mock('../src/replay', () => mock.replay)

const { components } = require('../')

const path = resolve(__dirname, '../../example/components/math/calculations')
const paths = [path]

it('should be', () => {
  expect(components).toBeDefined()
})

beforeAll(async () => {
  await components(paths)
})

it('should boot composition', () => {
  expect(stage.composition).toHaveBeenCalled()
  expect(stage.composition).toHaveBeenCalledWith(paths)
})

it('should load suite', async () => {
  expect(mock.suite.components).toHaveBeenCalledWith(paths)
})

it('should replay suite', async () => {
  const suite = await mock.suite.components.mock.results[0].value

  expect(mock.replay.replay).toHaveBeenCalledWith(suite)
})

it('should shutdown stage', () => {
  expect(stage.shutdown).toHaveBeenCalled()
})
