'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { map } = require('./')

it('should be', async () => {
  assert.ok(map instanceof Function)
})

it('should replace key-value pair', async () => {
  function transform (key, value) {
    return [key + '1', value + '1']
  }

  const input = { foo: 'bar' }
  const output = map(input, transform)

  assert.deepStrictEqual(output, { foo1: 'bar1' })
})

it('should replace nested key-value', async () => {
  function transform (key, value) {
    if (key === 'bar') return ['baz', value + ' world']
  }

  const input = { foo: { bar: 'hello' } }
  const output = map(input, transform)

  assert.deepStrictEqual(output, { foo: { baz: 'hello world' } })
})

it('should keep unmodified keys', async () => {
  function transform (key, value) {
    if (key === 'foo') return ['foo', 'replaced']
  }

  const input = { foo: 'value', bar: 'baz' }
  const output = map(input, transform)

  assert.deepStrictEqual(output, { foo: 'replaced', bar: 'baz' })
})

it('should transform values', async () => {
  function transform (value) {
    if (typeof value === 'string') return value + ' world'
  }

  const input = { foo: { bar: 'hello' } }
  const output = map(input, transform)

  assert.deepStrictEqual(output, { foo: { bar: 'hello world' } })
})

it('should transform values of object type', async () => {
  function transform (key, _) {
    if (key === 'foo') return [key, { baz: 'bye' }]
  }

  const input = { foo: { bar: 'hello' } }
  const output = map(input, transform)

  assert.deepStrictEqual(output, { foo: { baz: 'bye' } })
})
