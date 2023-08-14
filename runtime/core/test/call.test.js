'use strict'

const fixtures = require('./call.fixtures')
const { Call } = require('../src/call')

let call

beforeEach(() => {
  jest.clearAllMocks()

  call = new Call(fixtures.transmission, fixtures.contract)
})

it('should depend on transmission', () => {
  expect(fixtures.transmission.link).toHaveBeenLastCalledWith(call)
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

  await expect(call.invoke(request)).rejects.toBeDefined()
})
