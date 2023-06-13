import { generate } from 'randomstring'
import { createMethod } from './factory'
import { type Method } from './Method'
import * as syntax from './syntax'
import { Context } from './Context'
import { Component } from '@toa.io/core'

const remote = {
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>

const mapping = {
  endpoint: generate()
} as unknown as syntax.Mapping

const context: Context = { remote }

let method: Method

beforeEach(() => {
  jest.clearAllMocks()
})

describe.each([...syntax.methods])('%s', (verb) => {
  beforeEach(() => {
    method = createMethod(verb, mapping, context)
  })

  it('should call endpoint', async () => {
    const body = generate()
    const param = generate()
    const params = { [param]: generate() }
    const reply = await method.call(body, params)

    expect(remote.invoke).toHaveBeenCalledWith(mapping.endpoint, expect.anything())
    expect(reply).toStrictEqual(await remote.invoke.mock.results[0].value)
  })
})
