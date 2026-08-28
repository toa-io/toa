'use strict'
const clone = require('clone-deep')

const { normalize, extensions } = require('../../src/.component')
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
  it('should add predefined extensions', () => {
    extensions(manifest)

    expect(manifest.extensions['@toa.io/extensions.telemetry']).toBeNull()
    expect(manifest.extensions['@toa.io/extensions.fetch']).toBeNull()
  })

  it('should add predefined extensions without explicit declarations', () => {
    delete manifest.extensions

    extensions(manifest)

    expect(manifest.extensions).toStrictEqual({
      '@toa.io/extensions.telemetry': null,
      '@toa.io/extensions.fetch': null,
      '@toa.io/extensions.introspection': {}
    })
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
