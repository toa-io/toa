'use strict'

const { dirname } = require('node:path')
const clone = require('clone-deep')

const { normalize } = require('../../src/.component')
const fixtures = require('./normalize.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.operations)
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
})

describe('receivers', () => {
  it('should substitute default namespace', async () => {
    manifest.receivers = {
      'messages.created': 'add'
    }

    normalize(manifest)

    expect(manifest.receivers).toStrictEqual({
      'default.messages.created': 'add'
    })
  })

  it('should not substitute default namespace for foreign events', async () => {
    const receiver = {
      transition: 'add',
      source: 'test'
    }

    manifest.receivers = {
      'messages.created': receiver
    }

    normalize(manifest)

    expect(manifest.receivers).toStrictEqual({
      'messages.created': receiver
    })
  })
})
