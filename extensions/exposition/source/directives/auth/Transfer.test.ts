import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { Authorization } from './Authorization.ts'
import { Transfer } from './Transfer.ts'
import { Anonymous } from './Anonymous.ts'
import type { Context, Directive } from './types.ts'

function contextOf(headers: Record<string, string>, procedural = false): Context {
  return {
    request: { headers },
    pipelines: { body: [] },
    procedural
  } as unknown as Context
}

describe('Transfer', () => {
  it('should give the header to the input, as it was sent', () => {
    const context = contextOf({ authorization: 'Signature abc' })

    assert.equal(new Transfer('credential').authorize(null, context), true)

    const [embed] = context.pipelines.body as Array<(body: unknown) => unknown>

    assert.deepEqual(embed({ a: 1 }), { a: 1, credential: 'Signature abc' })
    assert.deepEqual(embed(undefined), { credential: 'Signature abc' })
  })

  it('should admit a request without the header, and give it nothing', () => {
    const context = contextOf({})

    assert.equal(new Transfer('credential').authorize(null, context), true)
    assert.equal(context.pipelines.body.length, 0)
  })

  it('should refuse a procedure', () => {
    assert.equal(
      new Transfer('credential').authorize(null, contextOf({ authorization: 'x' }, true)),
      false
    )
  })

  it('should take no property name that is not one', () => {
    assert.throws(() => new Transfer(''))
    assert.throws(() => new Transfer(true))
  })
})

describe('Authorization', () => {
  it('should keep nothing of `auth` beside a transfer, inherited or not', () => {
    const transfer = new Transfer('credential')
    const directives: Directive[] = [new Anonymous(true), transfer]

    new Authorization().arrange(directives)

    assert.deepEqual(directives, [transfer])
  })

  it('should not read a credential the method transfers', async () => {
    const context = contextOf({ authorization: 'Bearer foreign' })

    await new Authorization().preflight(context, [new Transfer('credential')])

    assert.equal(context.identity, null)
  })
})
