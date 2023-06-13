import { generate } from 'randomstring'
import { Endpoint } from './Endpoint'
import type { Component, Request } from '@toa.io/core'

const remote = {
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>

const endpointName = generate()
const request: Request = { input: generate() }

let endpoint: Endpoint

beforeEach(() => {
  jest.clearAllMocks()

  endpoint = new Endpoint(remote, endpointName)
})

it('should call remote', async () => {
  const reply = await endpoint.call(request)

  expect(remote.invoke).toHaveBeenCalledWith(endpointName, request)
  expect(reply).toStrictEqual(await remote.invoke.mock.results[0].value)
})
