'use strict'

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { expand } = require('../../src/.context')
const fixtures = require('./expand.fixtures')

/** @type {toa.formation.context.Declaration | object} */
let context

beforeEach(() => {
  context = clone(fixtures.context)
})

describe('annotations', () => {
  it('should not throw without annotations', () => {
    delete context.annotations

    expect(() => expand(context)).not.toThrow()
  })

  it('should expand known annotations', () => {
    const exposition = context.annotations['@toa.io/extensions.exposition']

    delete context.annotations
    context.exposition = exposition

    expand(context)

    expect(context.annotations).toStrictEqual(fixtures.context.annotations)
  })

  it('should recognize annotations', () => {
    context.annotations.mongodb = generate()

    expand(context)

    expect(context.annotations['@toa.io/storages.mongodb']).toBeDefined()
  })
})
