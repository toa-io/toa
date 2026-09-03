import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { validate } from '../../src/.context/index.js'
import * as fixtures from './validate.fixtures.js'

let context

before(() => {
  assert.doesNotThrow(() => validate(fixtures.context))
})

beforeEach(() => {
  context = clone(fixtures.context)
})

describe('runtime', () => {
  it('should require', () => {
    delete context.runtime
    assert.throws(() => validate(context), (error) => /required/.test(error.message))
  })

  it('should require registry to match uri format', () => {
    context.runtime.registry = 'not-a-uri'
    assert.throws(() => validate(context), (error) => /must match format/.test(error.message))

    context.runtime.registry = 'http://localhost'
    assert.doesNotThrow(() => validate(context))
  })

  it('should require proxy to match uri format', () => {
    context.runtime.proxy = 'not-a-uri'
    assert.throws(() => validate(context), (error) => /must match format/.test(error.message))

    context.runtime.proxy = 'http://localhost'
    assert.doesNotThrow(() => validate(context))
  })
})

describe('registry', () => {
  it('should require', () => {
    delete context.registry

    assert.throws(() => validate(context), (error) => /required property 'registry'/.test(error.message))
  })

  it('should set default platforms', () => {
    delete context.registry.platforms

    validate(context)

    assert.ok(context.registry.platforms instanceof Array)
    assert.deepStrictEqual(context.registry.platforms, ['linux/amd64', 'linux/arm/v7', 'linux/arm64'])
  })
})

it('should require name as label', () => {
  delete context.name
  assert.throws(() => validate(context), (error) => /required/.test(error.message))

  context.name = 'foo bar'
  assert.throws(() => validate(context), (error) => /pattern/.test(error.message))

  context.name = 'foo-bar'
  assert.doesNotThrow(() => validate(context))
})

it('should require registry url', () => {
  delete context.registry
  assert.throws(() => validate(context), (error) => /required/.test(error.message))
})

it('should allow mono replicas and resources', () => {
  context.mono = {
    replicas: 2,
    resources: {
      cpu: ['200m', '2'],
      memory: ['256Mi', '2Gi']
    }
  }

  assert.doesNotThrow(() => validate(context))
})

describe('compositions', () => {
  it('should allow services', () => {
    context.compositions[0].services = ['@toa.io/extensions.exposition']

    assert.doesNotThrow(() => validate(context))
  })

  it('should require services to be a non-empty array of strings', () => {
    context.compositions[0].services = []
    assert.throws(() => validate(context), (error) => /fewer than 1 items/.test(error.message))

    context.compositions[0].services = 'exposition'
    assert.throws(() => validate(context), (error) => /must be array/.test(error.message))
  })

  it('should reject an unknown property', () => {
    context.compositions[0].compoments = ['a.b']

    assert.throws(() => validate(context),
      (error) => /Property compoments is not expected to be here/.test(error.message))
  })
})
