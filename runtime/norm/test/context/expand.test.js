'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { expand } = require('../../src/.context')
const fixtures = require('./expand.fixtures')

/** @type {toa.norm.context.Declaration | object} */
let context

beforeEach(() => {
  context = clone(fixtures.context)
})

describe('annotations', () => {
  it('should not throw without annotations', () => {
    delete context.annotations

    assert.doesNotThrow(() => expand(context))
  })

  it('should expand known annotations', () => {
    const exposition = context.annotations['@toa.io/extensions.exposition']

    delete context.annotations
    context.exposition = exposition

    expand(context)

    assert.deepStrictEqual(context.annotations, fixtures.context.annotations)
  })

  it('should recognize annotations', () => {
    context.annotations.mongodb = generate()

    expand(context)

    assert.notStrictEqual(context.annotations['@toa.io/storages.mongodb'], undefined)
  })
})
