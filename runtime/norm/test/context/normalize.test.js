'use strict'

const { it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')
const { generate } = require('randomstring')

const fixtures = require('./normalize.fixtures')
const { normalize } = require('../../src/.context')

let context

beforeEach(() => {
  context = clone(fixtures.context)
})

it('should resolve local version', () => {
  context.runtime = '.'

  normalize(context)

  assert.notDeepStrictEqual(context.runtime, '.')
  assert.deepStrictEqual(context.runtime.version, require('@toa.io/runtime').version)
})

it('should expand registry', () => {
  const base = generate()

  context.registry = base

  normalize(context)

  assert.deepStrictEqual(context.registry, {
    base
  })
})
