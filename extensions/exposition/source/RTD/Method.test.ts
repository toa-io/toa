import { generate } from 'randomstring'
import { createBranch } from './factory'
import type { Node } from './Node'
import * as syntax from './syntax'
import { context } from './Context.mock'

const mapping: syntax.Mapping = {
  endpoint: generate(),
  type: 'observation'
}

const definition: syntax.Node = {
  '/': {
    GET: mapping
  }
}

let branch: Node

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each([...syntax.methods])('%s', (verb) => {
  beforeEach(() => {
    branch = createBranch(definition, context)
  })

  it('should call endpoint', async () => {
    const body = generate()
    const param = generate()
    const params = { [param]: generate() }
    const node = branch.match([context.namespace, context.name])
    const method = node?.methods.get('GET')
    const reply = await method?.call(body, params)

    expect(context.remote.invoke).toHaveBeenCalledWith(mapping.endpoint, expect.anything())
    expect(reply).toStrictEqual(await context.remote.invoke.mock.results[0].value)
  })
})
