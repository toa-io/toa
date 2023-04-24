'use strict'

const { generate } = require('randomstring')
const { PROTOCOLS } = require('./.test/constants')

const { manifest } = require('../')

it('should be', async () => {
  expect(manifest).toBeInstanceOf(Function)
})

it('should return manifest', async () => {
  const input = { [generate()]: 'http://' + generate() }
  const output = manifest(input)

  expect(output).toStrictEqual(input)
})

it('should fail if not Record<string, string>', async () => {
  const input = /** @type {toa.origins.Manifest} */ {
    foo: {
      bar: 'dev://null'
    }
  }

  expect(() => manifest(input)).toThrow()
})

it('should pass if valid', async () => {
  const input = { foo: 'amqp://' + generate() }

  expect(() => manifest(input)).not.toThrow()
})

it('should fail if not uri', async () => {
  const input = { [generate()]: generate() }

  expect(() => manifest(input)).toThrow('must match format')
})

it('should throw if protocol is not supported', async () => {
  const input = { foo: 'wat://' + generate() }

  expect(() => manifest(input)).toThrow('is not supported')
})

it('should convert null to {}', async () => {
  const output = manifest(null)
  
  expect(output).toStrictEqual({})
})

it.each(PROTOCOLS)('should support %s protocol', async (protocol) => {
  const input = { foo: protocol + '//' + generate() }

  expect(() => manifest(input)).not.toThrow()
})
