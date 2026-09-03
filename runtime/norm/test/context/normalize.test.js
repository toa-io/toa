import * as runtime from '@toa.io/runtime'
import { it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'
import { generate } from 'randomstring'

import * as fixtures from './normalize.fixtures.js'
import { normalize } from '../../src/.context/index.js'

let context

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should resolve local version', () => {
  context.runtime = '.'

  normalize(context)

  assert.notDeepStrictEqual(context.runtime, '.')
  assert.deepStrictEqual(context.runtime.version, runtime.version)
})

it('should expand registry', () => {
  const base = generate()

  context.registry = base

  normalize(context)

  assert.deepStrictEqual(context.registry, {
    base
  })
})
