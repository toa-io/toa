'use strict'

jest.mock('../src/connector')

const { Connector } = require('../src/connector')
const { Transmission } = require('../src/transmission')
const fixtures = require('./transmission.fixtures')

let transmission

beforeEach(() => {
  jest.clearAllMocks()

  transmission = new Transmission(fixtures.declaration, fixtures.bindings)
})

it('should be instance of Connector depending on bindings', () => {
  expect(transmission).toBeInstanceOf(Connector)
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.bindings)
})

it('should pass arguments and return value', async () => {
  const request = { foo: 'bar' }
  const result = await transmission.request(request)

  expect(fixtures.bindings[0].request).toHaveBeenCalledWith(fixtures.declaration.name, request)
  expect(result).toBe(await fixtures.bindings[0].request.mock.results[0].value)
})

it('should pick bindings sequentially', async () => {
  let result = await transmission.request()
  expect(result).toBe(await fixtures.bindings[0].request.mock.results[0].value)

  result = await transmission.request({ pick: 1 })
  expect(result).toBe(await fixtures.bindings[1].request.mock.results[0]?.value)
})

it('should throw exception if none succeeded', async () => {
  await expect(transmission.request({ pick: 5 })).rejects.toMatchObject({ code: 40 })

  fixtures.bindings.forEach((binding) =>
    expect(binding.request).toHaveBeenCalled())
})
