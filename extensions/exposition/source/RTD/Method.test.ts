import { generate } from 'randomstring'
import { Method } from './Method'
import * as syntax from './syntax'
import type { Endpoint } from './Endpoint'

const endpoint = {
  call: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Endpoint>

const body = generate()
const param = generate()
const params = { [param]: generate() }

let method: Method

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each([...syntax.methods])('%s', (verb) => {
  beforeEach(() => {
    method = Method.create(verb, endpoint)
  })

  it('should call endpoint', async () => {
    const reply = await method.call(body, params)

    expect(reply).toStrictEqual(await endpoint.call.mock.results[0].value)
  })
})
