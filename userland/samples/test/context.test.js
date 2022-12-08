'use strict'

const { resolve } = require('node:path')
const { directory: { glob } } = require('@toa.io/libraries/filesystem')

const fixtures = require('./context.fixtures')
const mock = fixtures.mock

jest.mock('../src/components', () => mock.components)

const { context } = require('../src/context')

it('should be', async () => {
  expect(context).toBeDefined()
})

const root = resolve(__dirname, './context')
const pattern = resolve(root, 'components/*')

/** @type {string[]} */
let paths

/** @type {boolean} */
let ok

beforeAll(async () => {
  paths = await glob(pattern)
})

beforeEach(async () => {
  jest.clearAllMocks()

  ok = await context(root)
})

it('should replay context components sample sets', async () => {
  expect(mock.components.components).toHaveBeenCalledWith(paths)
})

it('should return test result', async () => {
  const mocked = await mock.components.components.mock.results[0].value

  expect(ok).toStrictEqual(mocked)
})
