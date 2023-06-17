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

it('should handle placeholders', async () => {
  const input = { foo: 'http://${FOO}' + generate() + ':${BAR}/' } // eslint-disable-line no-template-curly-in-string

  expect(() => manifest(input)).not.toThrow()
})

it('should handle host shards', async () => {
  const input = { foo: 'http://{0-3}' + generate() }

  expect(() => manifest(input)).not.toThrow()
})

it('should handle port shards', async () => {
  const input = { foo: 'http://' + generate() + ':888{0-9}' }

  expect(() => manifest(input)).not.toThrow()
})

it.each(['dev:sec', 'dev'])('should throw if url contains credentials (%s)',
  async (credentials) => {
    const input = { foo: `http://${credentials}@${generate()}:888{0-9}` }

    expect(() => manifest(input)).toThrow('must not contain credentials')
  })
