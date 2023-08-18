import { generate } from 'randomstring'
import { type Query } from '../HTTP'
import { type Endpoint } from './Endpoint'
import { Method } from './Method'
import { type Mapping } from './Mapping'
import { type Parameter } from './Match'

const endpoint = { call: jest.fn() } as unknown as jest.MockedObject<Endpoint>

const mapping = {
  fit: jest.fn(() => generate())
} as unknown as jest.MockedObject<Mapping>

let method: Method

beforeEach(() => {
  jest.clearAllMocks()

  method = new Method(endpoint, mapping)
})

it('should call endpoint', async () => {
  const body = generate()
  const query: Query = { [generate()]: generate() }
  const parameters: Parameter[] = [{ name: generate(), value: generate() }]

  await method.call(body, query, parameters)

  expect(mapping.fit).toHaveBeenCalledWith(body, query, parameters)

  const request = mapping.fit.mock.results[0].value

  expect(endpoint.call).toHaveBeenCalledWith(request)
})
