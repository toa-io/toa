'use strict'

const { generate } = require('randomstring')
const { manifest } = require('../')

it('should be', async () => {
  expect(manifest).toBeInstanceOf(Function)
})

it('should return manifest', async () => {
  const input = { [generate()]: 'dev://' + generate() }
  const output = manifest(input)

  expect(output).toStrictEqual(input)
})

it('should fail not Record<string, string>', async () => {
  const input = /** @type {toa.origins.Manifest} */ {
    foo: {
      bar: 'dev://null'
    }
  }

  expect(() => manifest(input)).toThrow()
})

it('should pass if valid', async () => {
  const input = { foo: 'dev://' + generate() }

  expect(() => manifest(input)).not.toThrow()
})

it('should fail if not uri', async () => {
  const input = { [generate()]: generate() }

  expect(() => manifest(input)).toThrow('must match format')
})
