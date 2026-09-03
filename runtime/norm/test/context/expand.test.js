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

describe('composition services', () => {
  it('should resolve shortcuts', () => {
    context.compositions[0].services = ['exposition', 'configuration']

    expand(context)

    assert.deepStrictEqual(context.compositions[0].services,
      ['@toa.io/extensions.exposition', '@toa.io/extensions.configuration'])
  })

  it('should leave a package reference alone', () => {
    context.compositions[0].services = ['@acme/extension']

    expand(context)

    assert.deepStrictEqual(context.compositions[0].services, ['@acme/extension'])
  })

  it('should not throw without compositions', () => {
    delete context.compositions

    assert.doesNotThrow(() => expand(context))
  })
})
