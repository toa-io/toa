'use strict'

const { resolve } = require('node:path')
const { directory: { glob } } = require('@toa.io/filesystem')

const fixtures = require('./context.fixtures')
const { suite } = require('./suite.mock')
const { replay } = require('./replay.mock')

const mock = { suite, replay, ...fixtures.mock }

jest.mock('../src/suite', () => mock.suite)
jest.mock('../src/replay', () => mock.replay)
jest.mock('../src/components', () => mock.components)

const { context } = require('../src/context')
const { generate } = require('randomstring')

it('should be', async () => {
  expect(context).toBeDefined()
})

const CONTEXT = resolve(__dirname, './context')
const COMPONENTS = resolve(CONTEXT, 'components/*')

/** @type {string[]} */
let paths

/** @type {toa.samples.suite.Options} */
const options = { component: generate(), runner: { [generate()]: generate() } }

/** @type {boolean} */
let ok

beforeAll(async () => {
  paths = await glob(COMPONENTS)
})

beforeEach(async () => {
  jest.clearAllMocks()

  mock.components.components.mockImplementation(async () => true)

  ok = await context(CONTEXT, options)
})

it('should replay context components sample sets', async () => {
  expect(mock.components.components).toHaveBeenCalledWith(paths, options)
})

it('should load integration suite', async () => {
  expect(mock.suite.context).toHaveBeenCalledWith(CONTEXT, options)
})

it('should replay integration suite', async () => {
  const suite = await mock.suite.context.mock.results[0].value

  expect(replay.replay).toHaveBeenCalledWith(suite, paths, options.runner)
})

it('should return false if components replay failed', async () => {
  jest.clearAllMocks()

  mock.components.components.mockImplementation(async () => false)

  ok = await context(CONTEXT)

  expect(ok).toStrictEqual(false)
  expect(replay.replay).not.toHaveBeenCalled()
})

it('should return replay result if components replay ok', async () => {
  jest.clearAllMocks()

  mock.components.components.mockImplementation(async () => true)

  ok = await context(CONTEXT)

  const mocked = await mock.replay.replay.mock.results[0].value

  expect(ok).toStrictEqual(mocked)
})
