'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')

const { expand } = require('../../src/.component')
const fixtures = require('./expand.fixtures')

let source

beforeEach(() => {
  source = clone(fixtures.source)
})

it('should expand', async () => {
  await expand(source)
  assert.partialDeepStrictEqual(source, fixtures.target)
})

it('should derive version from the component contents', async () => {
  await expand(source)

  assert.match(source.version, /^[0-9a-f]{8}$/)
})

it('should keep declared version', async () => {
  source.version = '1.0.0'

  await expand(source)

  assert.deepStrictEqual(source.version, '1.0.0')
})

it('should recognize storages.queues', async () => {
  const queues = { foo: 'bar' }

  source.queues = clone(queues)

  await expand(source)

  assert.strictEqual(source.queues, undefined)
  assert.partialDeepStrictEqual(source.properties['@toa.io/storages.queues'], queues)
})
