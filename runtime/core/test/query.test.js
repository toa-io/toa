import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { Query } from '../source/query.js'
import * as fixtures from './query.fixtures.js'

beforeEach(() => {
  resetCalls()
})

describe('criteria', () => {
  it('should not throw if no criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)
    const query = instance.parse({})

    assert.strictEqual(query.criteria, undefined)
  })

  it('should parse criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)
    const query = instance.parse(fixtures.samples.simple.query)

    assert.deepStrictEqual(query.criteria, fixtures.samples.simple.parsed.criteria)
  })

  it('should coerce every value of a list', () => {
    const instance = new Query({ n: { type: 'integer' } })
    const query = instance.parse({ criteria: 'n=in=(1,2,3)' })

    assert.deepStrictEqual(query.criteria.right.value, [1, 2, 3])
  })

  it('should keep a parsed criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)

    const first = instance.parse(fixtures.samples.simple.query).criteria
    const second = instance.parse(fixtures.samples.simple.query).criteria

    assert.strictEqual(second, first)
  })

  it('should not keep an invalid criteria', () => {
    const instance = new Query(fixtures.samples.simple.properties)
    const query = { criteria: 'nonexistent==1' }

    assert.throws(() => instance.parse(query))
    assert.throws(() => instance.parse(query))
  })

  it('should parse criteria with type coercion', () => {
    const instance = new Query(fixtures.samples.extended.properties)
    const query = instance.parse(fixtures.samples.extended.query)

    assert.deepStrictEqual(query.criteria, fixtures.samples.extended.parsed.criteria)
  })

  it('should refuse a value the property cannot hold', () => {
    const strict = new Query({
      volume: { type: 'number' },
      count: { type: 'integer' },
      booked: { type: 'boolean' }
    })

    const refused = [
      ['volume>abc', /takes a number/],
      ['volume==1.5kg', /takes a number/],
      ['count==1.5', /takes an integer/],
      ['count==12kg', /takes an integer/],
      ['booked==yes', /takes a boolean/],
      ['booked==TRUE', /takes a boolean/],
      ['volume=in=(1,two)', /'two' is not one/]
    ]

    for (const [criteria, message] of refused)
      assert.throws(
        () => strict.parse({ criteria }),
        (error) => message.test(error.message),
        criteria
      )
  })

  it('should read a value the property can hold', () => {
    const strict = new Query({
      volume: { type: 'number' },
      count: { type: 'integer' },
      booked: { type: 'boolean' },
      title: { type: 'string' }
    })

    const read = [
      ['volume>1.5', 1.5],
      ['volume>-1.5', -1.5],
      ['count==12', 12],
      ['booked==false', false],
      ['title==12kg', '12kg']
    ]

    for (const [criteria, value] of read)
      assert.deepStrictEqual(
        strict.parse({ criteria }).criteria.right.value,
        value,
        criteria
      )
  })

  it('should read an unquoted null or undefined as no value', () => {
    const strict = new Query({ count: { type: 'integer' }, title: { type: 'string' } })

    const read = [
      ['count==null', null],
      ['count!=undefined', null],
      ['title==null', null],
      ['title==undefined', null],
      ['count=in=(1,null)', [1, null]],
      ['title=out=("null",undefined)', ['null', null]],
      ['title=="null"', 'null'],
      ["title=='undefined'", 'undefined'],
      ['title==nullish', 'nullish']
    ]

    for (const [criteria, value] of read)
      assert.deepStrictEqual(
        strict.parse({ criteria }).criteria.right.value,
        value,
        criteria
      )
  })

  it('should tell a quoted null from an unquoted one wherever it is', () => {
    const strict = new Query({ count: { type: 'integer' }, title: { type: 'string' } })

    const { criteria } = strict.parse({
      criteria: `(title=="a\\"null\\"",title==null) and count==null;title=in=('null' , "x")`
    })

    const values = []
    const collect = (node) =>
      node.type === 'COMPARISON'
        ? values.push(node.right.value)
        : (collect(node.left), collect(node.right))

    collect(criteria)

    assert.deepStrictEqual(values, ['a"null"', null, null, ['null', 'x']])
  })

  it('should refuse no value to an operator that orders', () => {
    const strict = new Query({ count: { type: 'integer' }, title: { type: 'string' } })

    for (const criteria of ['count>null', 'count<=undefined', 'title=gt=null'])
      assert.throws(
        () => strict.parse({ criteria }),
        (error) => /no value/.test(error.message),
        criteria
      )

    assert.throws(
      () => strict.parse({ criteria: 'count=="null"' }),
      (error) => /takes an integer/.test(error.message)
    )
  })

  it('should throw on a selector that is a property of every object', () => {
    const instance = new Query(fixtures.samples.simple.properties)

    for (const selector of ['constructor', 'toString', '__proto__'])
      assert.throws(
        () => instance.parse({ criteria: `${selector}==1` }),
        (error) => /not defined/.test(error.message),
        selector
      )
  })

  it('should throw on unknown properties', () => {
    const instance = new Query(fixtures.samples.simple.properties)

    assert.throws(
      () => instance.parse({ criteria: 'lastname==Johnson' }),
      (error) => /not defined/.test(error.message)
    )
  })

  it('should parse id', () => {
    const instance = new Query(fixtures.samples.id.properties)
    const query = instance.parse({ ...fixtures.samples.id.query })

    assert.deepStrictEqual(query, fixtures.samples.id.parsed)
  })
})

describe('options', () => {
  const instance = new Query(fixtures.samples.abc.properties)

  it('should not throw if no options', () => {
    const query = instance.parse({})

    assert.strictEqual(query.options, undefined)
  })

  describe('omit, limit', () => {
    it('should pass', () => {
      const input = { omit: 1, limit: 1 }
      const query = instance.parse(input)

      assert.deepStrictEqual(query.options, input)
    })
  })

  describe('sort', () => {
    it('should set default values', () => {
      const sort = ['a', 'b:desc', 'c']
      const query = instance.parse({ sort })

      assert.deepStrictEqual(query.options.sort, [
        ['a', 'asc'],
        ['b', 'desc'],
        ['c', 'asc']
      ])
    })

    it('should throw on unknown properties', () => {
      const sort = ['d:asc']

      assert.throws(
        () => instance.parse({ sort }),
        (error) => /not defined/.test(error.message)
      )
    })
  })

  describe('projection', () => {
    it('should throw on unknown properties', () => {
      const projection = ['a', 'b', 'c', 'd']

      assert.throws(
        () => instance.parse({ projection }),
        (error) => /not defined/.test(error.message)
      )
    })

    // a route declares one and sends it with every request it serves
    it('should leave the projection it was given alone', () => {
      const projection = ['a', 'b']
      const parsed = instance.parse({ projection })

      assert.deepStrictEqual(projection, ['a', 'b'])
      assert.deepStrictEqual(parsed.options.projection, [
        'a',
        'b',
        'VERSION',
        'CREATED',
        'UPDATED',
        'DELETED',
        'REGION'
      ])
    })
  })
})

function resetCalls(target = [assert, fixtures], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
