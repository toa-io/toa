'use strict'

const { Call } = require('../src/call')
const fixtures = require('./call.fixtures')

jest.mock('../src/exception')
jest.mock('../src/connector')

const { Exception } = require('../src/exception')
const { Connector } = require('../src/connector')

let call

beforeEach(() => {
  jest.clearAllMocks()

  call = new Call(fixtures.transmission, fixtures.contract)
})

it('should depend on transmission', () => {
  expect(call).toBeInstanceOf(Connector)
  expect(call).toBe(Connector.mock.instances[0])
  expect(Connector.mock.instances[0].depends).toHaveBeenCalledWith(fixtures.transmission)
})

it('should call transmission', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  expect(fixtures.transmission.request).toHaveBeenCalledWith(request)
})

it('should fit request', async () => {
  const request = fixtures.request().ok

  await call.invoke(request)

  expect(fixtures.contract.fit).toHaveBeenLastCalledWith(request)
})

it('should return reply', async () => {
  const request = fixtures.request().ok

  const reply = await call.invoke(request)

  expect(reply).toStrictEqual(fixtures.transmission.request.mock.results[0].value)
})

it('should throw received exceptions', async () => {
  const request = fixtures.request().bad

  await expect(call.invoke(request)).rejects.toBeInstanceOf(Exception)
  expect(Exception).toHaveBeenLastCalledWith(fixtures.transmission.request.mock.results[0].value.exception)
})
