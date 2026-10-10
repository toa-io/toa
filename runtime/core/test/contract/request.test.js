import * as schemas from '@toa.io/schemas'
import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import clone from 'clone-deep'
import { generate } from 'randomstring'

import { Request } from '../../source/contract/request.js'
import { Contract } from '../../source/contract/contract.js'
import * as fixtures from './contract.fixtures.js'

// the base is real; what it was constructed with and told to fit is observable
const fit = mock.method(Contract.prototype, 'fit', () => undefined)

let contract

beforeEach(() => {
  resetCalls()
  fit.mock.resetCalls()

  contract = new Request(fixtures.schema, {})
})

const dummy = { properties: {} }

it('should extend Conditions', () => {
  assert.ok(contract instanceof Contract)
  assert.strictEqual(contract.schema, fixtures.schema)
})

it('should fit request', () => {
  const request = { [generate()]: generate() }

  contract.fit(request)

  assert.ok(
    fit.mock.calls.some(
      (call) => call.this === contract && isDeepStrictEqual(call.arguments[0], request)
    )
  )
})

describe('schema', () => {
  let schema

  beforeEach(() => {
    schema = clone(fixtures.schemas.request)
  })

  it('should provide schema', () => {
    assert.notStrictEqual(Request.schema({}, dummy), undefined)
  })

  it('should add required input if defined', () => {
    const input = { type: 'number' }

    assert.deepStrictEqual(Request.schema({ input }, dummy).properties.input, input)
  })

  it('should set input as null if undefined', async () => {
    assert.deepStrictEqual(Request.schema({}, dummy).properties.input, { type: 'null' })
  })

  it('should contain query if declaration.query is not defined', () => {
    assert.notStrictEqual(Request.schema({}, dummy).properties.query, undefined)
  })

  it('should not contain query if declaration.query is false', () => {
    schema.properties.query = { type: 'null' }
    assert.partialDeepStrictEqual(Request.schema({ query: false }, dummy), schema)
  })

  it('should require query if declaration.query is true', () => {
    schema.required = ['query']
    assert.ok(
      ['query'].every((item) =>
        Request.schema({ query: true }, dummy).required.some((candidate) =>
          isDeepStrictEqual(candidate, item)
        )
      )
    )
  })

  it('should forbid projection for non observations', () => {
    assert.strictEqual(
      Request.schema({ type: 'transition' }, dummy).properties.query.properties
        .projection,
      undefined
    )

    assert.strictEqual(
      Request.schema({ type: 'assignment' }, dummy).properties.query.properties
        .projection,
      undefined
    )

    assert.notStrictEqual(
      Request.schema({ type: 'observation' }, dummy).properties.query.properties
        .projection,
      undefined
    )
  })

  it('should forbid version for observations', () => {
    assert.notStrictEqual(
      Request.schema({ type: 'transition' }, dummy).properties.query.properties.version,
      undefined
    )

    assert.strictEqual(
      Request.schema({ type: 'observation' }, dummy).properties.query.properties.version,
      undefined
    )
  })

  it('should allow omit, limit only for sets', () => {
    const query = (type, scope) =>
      Request.schema({ type, scope }, dummy).properties.query.properties

    for (const [type, scope] of [
      ['transition', 'entry'],
      ['observation', 'entry'],
      ['assignment', 'changeset']
    ]) {
      assert.strictEqual(query(type, scope).omit, undefined)
      assert.strictEqual(query(type, scope).limit, undefined)
    }

    for (const type of ['observation', 'transition', 'effect']) {
      assert.notStrictEqual(query(type, 'entries').omit, undefined)
      assert.notStrictEqual(query(type, 'entries').limit, undefined)
    }
  })

  for (const type of ['observation', 'transition', 'effect']) {
    const fits = (query) =>
      schemas
        .schema(
          Request.schema(
            { type, scope: 'entries' },
            { properties: { id: { type: 'string' } } }
          )
        )
        .fit({ input: null, query }) === null

    it(`should bound the set of ${type}`, () => {
      assert.ok(!fits({ criteria: 'a==1' }))
      assert.ok(fits({ criteria: 'a==1', limit: 1 }))
      assert.ok(fits({ ids: ['a'] }))
      assert.ok(!fits({ criteria: 'a==1', limit: 0 }))
    })

    it(`should order what ${type} omits`, () => {
      assert.ok(!fits({ omit: 1, limit: 1 }))
      assert.ok(fits({ omit: 1, limit: 1, sort: ['a'] }))
      assert.ok(fits({ omit: 1, limit: 1, sort: ['a.b:desc'] }))
      assert.ok(!fits({ omit: 1, limit: 1, sort: ['a..b'] }))
    })
  }
})

describe('source', () => {
  const compile = (definition, entity) =>
    schemas.schema(Request.schema(definition, entity))

  it('should not hold source to a schema', () => {
    const schema = Request.schema({}, dummy)

    assert.strictEqual(schema.properties.source, undefined)
  })

  it('should pass known source variants', () => {
    const schema = compile({}, undefined)

    for (const source of [
      { namespace: 'a', component: 'b', operation: 'c' },
      { namespace: 'a', component: 'b', event: 'c' },
      { service: 'exposition' }
    ]) {
      const request = { input: null, query: null, source }

      assert.deepStrictEqual(schema.fit(request), null)
      assert.deepStrictEqual(request.source, source)
    }
  })

  // whatever a peer puts beside the keys this release knows travels through: what reads
  // `source` takes the keys it knows, and the contract does not fail a call over the rest
  it('should pass a source a peer added to', () => {
    const schema = compile({}, undefined)
    const request = {
      input: null,
      query: null,
      source: { service: 'exposition', mystery: 'x' }
    }

    assert.deepStrictEqual(schema.fit(request), null)
    assert.deepStrictEqual(request.source, { service: 'exposition', mystery: 'x' })
  })
})

function resetCalls(target = [assert, clone, fixtures, dummy], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

describe('discovery', () => {
  it('should say an operation that states its window is safe to retry', () => {
    assert.strictEqual(new Request(fixtures.schema, { once: 86400 }).discovery.once, true)
    assert.strictEqual(new Request(fixtures.schema, { once: true }).discovery.once, true)
    assert.strictEqual(
      new Request(fixtures.schema, { once: false }).discovery.once,
      false
    )
    assert.strictEqual(new Request(fixtures.schema, {}).discovery.once, undefined)
  })
})
