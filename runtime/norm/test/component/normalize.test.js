'use strict'
const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

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

    assert.deepStrictEqual(manifest.operations.add.bindings, manifest.bindings)
  })
})

describe('extensions', () => {
  it('should add predefined extensions', () => {
    extensions(manifest)

    assert.strictEqual(manifest.extensions['@toa.io/extensions.telemetry'], null)
    assert.strictEqual(manifest.extensions['@toa.io/extensions.fetch'], null)
  })

  it('should add predefined extensions without explicit declarations', () => {
    delete manifest.extensions

    extensions(manifest)

    assert.deepStrictEqual(manifest.extensions, {
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

    assert.deepStrictEqual(manifest.receivers, {
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

    assert.deepStrictEqual(manifest.receivers, {
      'messages.created': receiver
    })
  })
})
