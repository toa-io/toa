'use strict'

jest.mock('@kookaburra/runtime')
jest.mock('@kookaburra/http')

const { Runtime } = require('@kookaburra/runtime')
const http = require('@kookaburra/http')
const { composition } = require('../src/composition')
const fixtures = require('./composition.fixtures')

let instance

beforeAll(async () => {
  fixtures.components = await fixtures.components
})

beforeEach(async () => {
  jest.clearAllMocks()

  instance = await composition(fixtures.paths)
})

it('should create http binding', () => {
  expect(http.Binding).toHaveBeenCalledTimes(1)
})

it('should bind Runtimes ', () => {
  const binding = http.Binding.mock.instances[0]

  expect(binding.bind).toHaveBeenCalledTimes(fixtures.paths.length)

  binding.bind.mock.calls.forEach((args, index) => {
    const operations = fixtures.components[index].operations

    expect(args.length).toBe(2)
    expect(args[0]).toStrictEqual(Runtime.mock.instances[index])
    expect(args[1]).toStrictEqual(operations)
  })
})

it('should set runtime as http dependency', () => {
  const binding = http.Binding.mock.instances[0]

  expect(binding.depends.mock.calls.length).toBe(fixtures.paths.length)

  binding.depends.mock.calls.forEach((args, index) => {
    expect(args.length).toBe(1)
    expect(args[0]).toStrictEqual(Runtime.mock.instances[index])
  })
})

it('should set http as composition dependency', () => {
  const binding = http.Binding.mock.instances[0]

  expect(instance.depends).toHaveBeenCalledWith(binding)
})
