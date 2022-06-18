'use strict'

const { dirname, resolve } = require('node:path')
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

describe('extensions', () => {
  it('should resolve absolute references', () => {
    const origins = manifest.extensions['@toa.io/extensions.origins']
    const path = dirname(require.resolve('@toa.io/extensions.origins/package.json'))

    normalize(manifest)

    expect(manifest.extensions[path]).toStrictEqual(origins)
  })

  it('should resolve relative references', () => {
    const ref = './dummies/extension'
    const declaration = manifest.extensions[ref]
    const path = resolve(__dirname, ref)

    normalize(manifest)

    expect(declaration).toBeDefined()
    expect(manifest.extensions[path]).toStrictEqual(declaration)
  })

  it('should throw if manifest is undefined', () => {
    manifest.extensions['./dummies/extension'].ok = false

    expect(() => normalize(manifest)).toThrow(/didn't return manifest/)
  })
})
