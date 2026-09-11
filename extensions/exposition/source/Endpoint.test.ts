import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Endpoint } from './Endpoint.ts'
import { Mapping } from './Mapping.ts'
import type { Remote } from '@toa.io/core'
import type * as http from './HTTP/index.ts'
import type { Parameter } from './RTD/index.ts'

/**
 * What `Remote.explain` answers is the contract's own object, the same one every time and
 * on every route that mounts the endpoint — which is what this stands in for.
 */
function remote(): Promise<Remote> {
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

  it('should state what picks the records, where the method is queryable', async () => {
    const endpoint = new Endpoint('enumerate', Mapping.create({}), remote())
    const introspection = await endpoint.explain([])

    assert.deepEqual(Object.keys(introspection.selection ?? {}), [
      'criteria',
      'sort',
      'limit',
      'omit'
    ])
  })

  it('should omit selection where the method is not queryable', async () => {
    const introspection = await endpoint(remote()).explain([])

    assert.equal(introspection.selection, undefined)
  })

  it('should not page a method that answers one object', async () => {
    const endpoint = new Endpoint('observe', Mapping.create({}, false), remote())
    const introspection = await endpoint.explain([])

    assert.deepEqual(Object.keys(introspection.selection ?? {}), ['criteria', 'sort'])
  })

  it('should omit a closed criteria from selection', async () => {
    const endpoint = new Endpoint(
      'enumerate',
      Mapping.create({ criteria: 'temperature>60' }),
      remote()
    )
    const introspection = await endpoint.explain([])

    assert.equal('criteria' in (introspection.selection ?? {}), false)
    assert.ok(introspection.selection?.sort !== undefined)
  })
})

describe('idempotency key', () => {
  /** What the remote was asked to invoke, which is what the gateway built. */
  async function sent(context: Partial<Context>): Promise<{ id?: string }> {
    let request: { id?: string } = {}

    const remote = Promise.resolve({
      explain: async () => ({ input: null, output: null }),
      invoke: async (_endpoint: string, sending: { id?: string }) => {
        request = sending

        return null
      }
    } as unknown as Remote)

    await new Endpoint('echo', Mapping.create(), remote).call(calling(context), [])

    return request
  }

  it('should leave a request without a key carrying no identity', async () => {
    assert.equal((await sent({})).id, undefined)
  })

  it('should give a request under a key an identity', async () => {
    const { id } = await sent({ key: 'a-key' })

    assert.match(id ?? '', /^[\da-f]{32}$/)
  })

  // the whole of what a key is for: the retry a client is not sure about is the same call
  it('should give one identity to the same key, principal, method and path', async () => {
    const one = await sent({ key: 'a-key', identity: 'u1' })
    const other = await sent({ key: 'a-key', identity: 'u1' })

    assert.equal(one.id, other.id)
  })

  it('should give another identity to another key', async () => {
    const one = await sent({ key: 'a-key', identity: 'u1' })
    const other = await sent({ key: 'other-key', identity: 'u1' })

    assert.notEqual(one.id, other.id)
  })

  /*
   * Two clients that both pick `1` must not be answered with each other's replies — nor be
   * able to suppress each other's writes by getting there first.
   */
  it('should give another identity to another principal', async () => {
    const one = await sent({ key: 'a-key', identity: 'u1' })
    const other = await sent({ key: 'a-key', identity: 'u2' })

    assert.notEqual(one.id, other.id)
  })

  it('should give another identity to another path', async () => {
    const one = await sent({ key: 'a-key', identity: 'u1', path: '/pots/1/' })
    const other = await sent({ key: 'a-key', identity: 'u1', path: '/pots/2/' })

    assert.notEqual(one.id, other.id)
  })

  it('should give another identity to another method', async () => {
    const one = await sent({ key: 'a-key', identity: 'u1', method: 'POST' })
    const other = await sent({ key: 'a-key', identity: 'u1', method: 'PATCH' })

    assert.notEqual(one.id, other.id)
  })
})

interface Context {
  key: string
  identity: string
  method: string
  path: string
}

function calling(context: Partial<Context>): http.Context {
  const headers: Record<string, string> = {}

  if (context.key !== undefined) headers['idempotency-key'] = context.key

  return {
    body: async () => ({}),
    url: new URL('https://nex.toa.io' + (context.path ?? '/pots/')),
    request: { method: context.method ?? 'POST', headers },
    identity: context.identity === undefined ? null : { id: context.identity }
  } as unknown as http.Context
}
