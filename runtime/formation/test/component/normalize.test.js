'use strict'

const clone = require('clone-deep')

const { normalize } = require('../../src/component/normalize')
const fixtures = require('./normalize.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.operations)
})

describe('environment', () => {
  it('should convolve with environment argument', () => {
    normalize(manifest, 'local')
    expect(manifest.operations.add.bindings).toStrictEqual(['foo'])
  })
})

describe('operations', () => {
  it('should set default bindings', () => {
    normalize(manifest)

    expect(manifest.operations.add.bindings).toStrictEqual(manifest.bindings)
  })
})
