'use strict'

const { map } = require('./')

it('should be', async () => {
  expect(map).toBeInstanceOf(Function)
})

it('should replace key-value pair', async () => {
  function transform (key, value) {
    return [key + '1', value + '1']
  }

  const input = { foo: 'bar' }
  const output = map(input, transform)

  expect(output).toStrictEqual({ foo1: 'bar1' })
})

it('should replace nested key-value', async () => {
  function transform (key, value) {
    if (key === 'bar') return ['baz', value + ' world']
  }

  const input = { foo: { bar: 'hello' } }
  const output = map(input, transform)

  expect(output).toStrictEqual({ foo: { baz: 'hello world' } })
})

it('should keep unmodified keys', async () => {
  function transform (key, value) {
    if (key === 'foo') return ['foo', 'replaced']
  }

  const input = { foo: 'value', bar: 'baz' }
  const output = map(input, transform)

  expect(output).toStrictEqual({ foo: 'replaced', bar: 'baz' })
})

it('should transform values', async () => {
  function transform (value) {
    return value + ' world'
  }

  const input = { foo: { bar: 'hello' } }
  const output = map(input, transform)

  expect(output).toStrictEqual({ foo: { bar: 'hello world' } })
})
