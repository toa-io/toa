'use strict'

const clone = require('clone-deep')

const { normalize } = require('../src/manifest/normalize')
const fixtures = require('./manifest.normalize.fixtures')

describe('normalize', () => {
  let manifest, resources

  const map = (operation) => ({
    ...fixtures.manifest.operations[operation],
    operation
  })

  beforeEach(() => {
    manifest = clone(fixtures.manifest)
    resources = clone(fixtures.resources)
  })

  it('should expand operations', () => {
    normalize(resources, manifest)

    expect(resources['/top'].operations)
      .toStrictEqual(fixtures.resources['/top'].operations.map(map))

    expect(resources['/top']['/nested'].operations)
      .toStrictEqual(fixtures.resources['/top']['/nested'].operations.map(map))
  })
})
