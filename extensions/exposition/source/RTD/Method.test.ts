import { generate } from 'randomstring'
import { createBranch } from './factory'
import type { Node } from './Node'
import * as syntax from './syntax'
import { remotes } from './Context.mock'
import { Component } from '@toa.io/core'

const namespace = generate()
const component = generate()

const mapping: syntax.Mapping = {
  namespace,
  component,
  endpoint: generate(),
  type: 'observation'
}

let branch: Node

beforeEach(() => {
  jest.clearAllMocks()
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
    const param = generate()
    const params = { [param]: generate() }
    const node = branch.match([namespace, component])
    const method = node?.methods.get(verb)
    const reply = await method?.call(body, params)
    const remote: jest.MockedObject<Component> = await remotes.discover.mock.results[0].value

    expect(remote.invoke).toHaveBeenCalledWith(mapping.endpoint, expect.anything())
    expect(reply).toStrictEqual(await remote.invoke.mock.results[0].value)
  })
})

function defineBranch (node: syntax.Node): syntax.Branch {
  return { namespace, component, node }
}
