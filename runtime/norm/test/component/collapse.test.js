'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')

const fixtures = require('./collapse.fixtures')
const { collapse } = require('../../src/.component')

let samples

beforeEach(() => {
  samples = clone(fixtures.samples)
})

it('should ignore locator', () => {
  const source = {}
  const prototype = { namespace: 'foo1', name: 'bar1' }
  const manifest = clone(source)

  collapse(manifest, prototype)

  assert.deepStrictEqual(manifest, source)
})

it('should remove prototype property', () => {
  const manifest = { prototype: 'a' }

  collapse(manifest, {})

  assert.deepStrictEqual(manifest, {})
})

describe('entity', () => {
  it('should merge entity schema', () => {
    const manifest = clone(samples.entity.manifest)

    collapse(manifest, samples.entity.prototype)
    assert.deepStrictEqual(manifest, samples.entity.result)
  })
})

it('should ignore bindings', () => {
  const source = { bindings: ['foo'] }
  const prototype = { bindings: ['bar'] }
  const manifest = clone(source)

  collapse(manifest, prototype)
  assert.deepStrictEqual(manifest, source)

  delete manifest.bindings

  collapse(manifest, prototype)
  assert.deepStrictEqual(manifest, {})
})

it('should merge operations', () => {
  const manifest = clone(samples.operations.manifest)
  const prototype = clone(samples.operations.prototype)

  collapse(manifest, prototype, '/somewhere')

  // the prototype's path is generated, so it is checked apart from the shape
  assert.strictEqual(typeof manifest.prototype.path, 'string')

  const { path, ...rest } = manifest.prototype

  assert.deepStrictEqual({ ...manifest, prototype: rest }, samples.operations.result)
})
