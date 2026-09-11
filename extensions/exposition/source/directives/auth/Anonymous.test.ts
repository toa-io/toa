import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Anonymous } from './Anonymous.ts'
import type { Context } from './types.ts'

const context = (
  headers: Record<string, string>,
  flags: { procedural?: boolean; exploratory?: boolean } = {}
): Context =>
  ({
    request: { headers },
    procedural: false,
    exploratory: false,
    ...flags
  }) as unknown as Context

describe('anonymous', () => {
  it('should admit a request that presents nothing', () => {
    assert.equal(new Anonymous(true).authorize(null, context({})), true)
  })

  it('should refuse a request that presents a credential', () => {
    // it would make the reply uncacheable, which is the whole of the rule
    assert.equal(
      new Anonymous(true).authorize(null, context({ authorization: 'Token x' })),
      false
    )
  })

  it('should admit a procedure whatever the request presented', () => {
    // what a procedure answers is a value in an envelope, and the envelope is `no-store`
    const procedural = context({ authorization: 'Token x' }, { procedural: true })

    assert.equal(new Anonymous(true).authorize(null, procedural), true)
  })

  it('should admit a description whatever the request presented', () => {
    // a description is not the reply a cache would hold, and varies by who asked in any case
    const exploratory = context({ authorization: 'Token x' }, { exploratory: true })

    assert.equal(new Anonymous(true).authorize(null, exploratory), true)
  })

  it('should refuse where it admits nobody', () => {
    assert.equal(new Anonymous(false).authorize(null, context({})), false)
    assert.equal(
      new Anonymous(false).authorize(null, context({}, { procedural: true })),
      false
    )
    assert.equal(
      new Anonymous(false).authorize(null, context({}, { exploratory: true })),
      false
    )
  })

  it('should describe a method as it authorizes one', () => {
    const directive = new Anonymous(true)

    assert.equal(directive.admits(null, context({ authorization: 'Token x' })), false)
    assert.equal(
      directive.admits(null, context({ authorization: 'Token x' }, { procedural: true })),
      true
    )
    assert.equal(
      directive.admits(null, context({ authorization: 'Token x' }, { exploratory: true })),
      true
    )
  })
})
