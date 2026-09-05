import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Endpoint } from './Endpoint.js'
import { Mapping } from './Mapping.js'
import type { Remote } from '@toa.io/core'
import type { Parameter } from './RTD/index.js'

/**
 * What `Remote.explain` answers is the contract's own object, the same one every time and
 * on every route that mounts the endpoint — which is what this stands in for.
 */
function remote (): Promise<Remote> {
  const explanation = {
    input: {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' }
      },
      required: ['a', 'b']
    },
    output: null
  }

  return Promise.resolve({
    explain: async () => explanation
  } as unknown as Remote)
}

const endpoint = (discovery: Promise<Remote>): Endpoint =>
  new Endpoint('parameters', Mapping.create(), discovery)

const variable: Parameter[] = [{ name: 'a', value: 'a1b2' }]

describe('explain', () => {
  it('should state a route variable as the route, not as the input', async () => {
    const introspection = await endpoint(remote()).explain(variable)

    assert.deepEqual(Object.keys(introspection.route ?? {}), ['a'])
    assert.deepEqual(Object.keys((introspection.input as any).properties), ['b'])
    assert.deepEqual((introspection.input as any).required, ['b'])
  })

  it('should leave the operation for the next route that mounts it', async () => {
    const discovery = remote()

    await endpoint(discovery).explain(variable)

    // a second route on the same endpoint, taking no variable of its own
    const introspection = await endpoint(discovery).explain([])

    assert.deepEqual(Object.keys((introspection.input as any).properties), ['a', 'b'])
    assert.deepEqual((introspection.input as any).required, ['a', 'b'])
  })

  it('should answer a copy, so what one caller narrows the next still sees', async () => {
    const one = endpoint(remote())
    const first = await one.explain(variable)

    delete (first.input as any).properties.b

    const second = await one.explain(variable)

    assert.deepEqual(Object.keys((second.input as any).properties), ['b'])
  })
})
