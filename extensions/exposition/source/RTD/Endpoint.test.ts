import { generate } from 'randomstring'
import { Endpoint } from './Endpoint'
import type { Component } from '@toa.io/core'

const remote = {
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>

const discovery = Promise.resolve(remote)
const endpointName = generate()

let endpoint: Endpoint

beforeEach(() => {
  jest.clearAllMocks()

  endpoint = new Endpoint(discovery, endpointName)
})

it('should call remote', async () => {
  const request = { input: generate() }
  const reply = await endpoint.call(request)

  expect(remote.invoke).toHaveBeenCalledWith(endpointName, request)
  expect(reply).toStrictEqual(await remote.invoke.mock.results[0].value)
})
