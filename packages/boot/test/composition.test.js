'use strict'

jest.mock('@kookaburra/runtime')
jest.mock('@kookaburra/http')

const { Runtime } = require('@kookaburra/runtime')
const { Server: HTTP } = require('@kookaburra/http')
const { composition } = require('../src/composition')
const assets = require('./composition.assets')

let instance

beforeAll(async () => {
  assets.components = await assets.components
})

beforeEach(async () => {
  jest.clearAllMocks()

  instance = await composition(assets.paths)
})

it('should create http', () => {
  expect(HTTP).toHaveBeenCalledTimes(1)
})

it('should bind Runtimes to http', () => {
  const http = HTTP.mock.instances[0]

  expect(http.bind).toHaveBeenCalledTimes(assets.paths.length)

  http.bind.mock.calls.forEach((args, index) => {
    const operations = assets.components[index].operations

    expect(args.length).toBe(2)
    expect(args[0]).toStrictEqual(Runtime.mock.instances[index])
    expect(args[1]).toStrictEqual(operations)
  })
})

it('should set runtime as http dependency', () => {
  const http = HTTP.mock.instances[0]

  expect(http.depends.mock.calls.length).toBe(assets.paths.length)

  http.depends.mock.calls.forEach((args, index) => {
    expect(args.length).toBe(1)
    expect(args[0]).toStrictEqual(Runtime.mock.instances[index])
  })
})

it('should set http as composition dependency', () => {
  const http = HTTP.mock.instances[0]

  expect(instance.depends).toHaveBeenCalledWith(http)
})
