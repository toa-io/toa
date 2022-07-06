'use strict'

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

  expect(context.runtime).not.toEqual('.')
  expect(context.runtime.version).toEqual(require('@toa.io/runtime').version)
})

it('should expand registry', () => {
  const base = generate()

  context.registry = base

  normalize(context)

  expect(context.registry).toEqual({
    base
  })
})
