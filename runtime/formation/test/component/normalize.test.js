'use strict'

const clone = require('clone-deep')

const { normalize } = require('../../src/component/normalize')
const fixtures = require('./normalize.fixtures')

let manifest

describe('operations', () => {
  beforeEach(() => {
    manifest = clone(fixtures.operations)
  })

  it('should set default bindings', () => {
    normalize(manifest)

    expect(manifest.operations.add.bindings).toStrictEqual(manifest.bindings)
  })
})
