import * as definitions from '@toa.io/definitions'
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
  assert.deepStrictEqual(context.runtime.version, definitions.version)
})

it('should expand registry', () => {
  const base = generate()

  context.registry = base

  normalize(context)

  assert.deepStrictEqual(context.registry, {
    base,
    platforms: ['linux/amd64', 'linux/arm/v7', 'linux/arm64']
  })
})

it('should set default platforms', () => {
  context.registry = { base: generate() }

  normalize(context)

  assert.deepStrictEqual(context.registry.platforms, [
    'linux/amd64',
    'linux/arm/v7',
    'linux/arm64'
  ])
})
