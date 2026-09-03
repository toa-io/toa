import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'
import { generate } from 'randomstring'

import { expand } from '../../src/.context/index.js'
import * as fixtures from './expand.fixtures.js'

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
