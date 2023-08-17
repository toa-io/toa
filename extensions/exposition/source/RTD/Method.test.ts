import { generate } from 'randomstring'
import { type Component } from '@toa.io/core'
import { createBranch } from './factory'
import * as syntax from './syntax'
import { remotes } from './Context.mock'
import { QueryMethod } from './Method'
import { type Endpoint } from './Endpoint'
import { type Parameter } from './Match'
import type { Node } from './Node'

const namespace = generate()
const component = generate()

const mapping: syntax.Mapping = {
  namespace,
  component,
  endpoint: generate(),
  type: 'observation'
}

const endpoint = { call: jest.fn() } as unknown as jest.MockedObject<Endpoint>

let branch: Node

beforeEach(() => {
  jest.clearAllMocks()
})

describe('QueryMethod', () => {
  let method: QueryMethod

  beforeEach(() => {
    method = new QueryMethod(endpoint)
  })

  it('should send body', async () => {
    const body = generate()

    await method.call(body, {}, [])

    expect(endpoint.call.mock.calls[0][0]).toMatchObject({ input: body })
  })

  it('should send query', async () => {
    const query = { criteria: 'foo==bar' }

    await method.call({}, query, [])

    expect(endpoint.call.mock.calls[0][0]).toMatchObject({
      query: { criteria: 'foo==bar' }
    })
  })

  it('should use params as criteria', async () => {
    const parameters: Parameter[] = [
      { name: generate(), value: generate() },
      { name: generate(), value: generate() }
    ]

    await method.call({}, {}, parameters)

    expect(endpoint.call.mock.calls[0][0]).toMatchObject({
      query: {
        criteria: `${parameters[0].name}==${parameters[0].value};` +
          `${parameters[1].name}==${parameters[1].value}`
      }
    })
  })

  it('should combine criteria', async () => {
    const parameter: Parameter = { name: 'foo', value: 'bar' }
    const query = { criteria: 'baz==qux,qux==bar' }

    await method.call({}, query, [parameter])

    expect(endpoint.call.mock.calls[0][0]).toMatchObject({
      query: {
        criteria: 'foo==bar;(baz==qux,qux==bar)'
      }
    })
  })
})

describe.each([...syntax.methods])('%s', (verb) => {
  beforeEach(() => {
    const definition = defineBranch({
      '/': {
        [verb]: mapping
      }
    })

    branch = createBranch(definition, remotes)
  })

  it('should call endpoint', async () => {
    const body = generate()
    const query = { [generate()]: generate() }
    const node = branch.match([namespace, component], [])
    const method = node?.methods.get(verb)
    const reply = await method?.call(body, query, [])
    const remote: jest.MockedObject<Component> = await remotes.discover.mock.results[0].value

    expect(remote.invoke).toHaveBeenCalledWith(mapping.endpoint, expect.anything())
    expect(reply).toStrictEqual(await remote.invoke.mock.results[0].value)
  })
})

function defineBranch (node: syntax.Node): syntax.Branch {
  return { namespace, component, node }
}
