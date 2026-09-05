import assert from 'node:assert'
import { describe, it } from 'node:test'
import { Delegate } from './Delegate.js'
import type { Introspection } from '../../Introspection.js'

describe('auth:delegate', () => {
  function explanation (): Introspection {
    return {
      input: {
        type: 'object',
        properties: {
          identity: { type: 'object' },
          title: { type: 'string' }
        },
        required: ['identity', 'title']
      }
    } as unknown as Introspection
  }

  it('should take the property it embeds out of the input', () => {
    const delegate = new Delegate('identity', null as never)
    const described = delegate.describe(explanation())
    const input = described.input as { properties: object, required: string[] }

    assert.deepStrictEqual(Object.keys(input.properties), ['title'])
    assert.deepStrictEqual(input.required, ['title'])
  })

  it('should leave an input that does not declare it alone', () => {
    const delegate = new Delegate('originator', null as never)
    const described = delegate.describe(explanation())
    const input = described.input as { properties: object }

    assert.deepStrictEqual(Object.keys(input.properties), ['identity', 'title'])
  })
})
