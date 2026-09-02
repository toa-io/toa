import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { normalize, extensions } from '../../src/.component/index.js'
import * as fixtures from './normalize.fixtures.js'

let manifest

beforeEach(() => {
  manifest = clone(fixtures.operations)
})

describe('operations', () => {
  it('should set default bindings', async () => {
    await normalize(manifest)

    assert.deepStrictEqual(manifest.operations.add.bindings, manifest.bindings)
  })
})

describe('extensions', () => {
  it('should add predefined extensions', async () => {
    await extensions(manifest)

    assert.strictEqual(manifest.extensions['@toa.io/extensions.telemetry'], null)
    assert.strictEqual(manifest.extensions['@toa.io/extensions.fetch'], null)
  })

  it('should add predefined extensions without explicit declarations', async () => {
    delete manifest.extensions

    await extensions(manifest)

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

    await normalize(manifest)

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

    await normalize(manifest)

    assert.deepStrictEqual(manifest.receivers, {
      'messages.created': receiver
    })
  })
})
