'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const fixtures = require('./image.fixtures')
const { generate } = require('randomstring')

/** @type {toa.deployment.images.Image} */
let instance

beforeEach(() => {
  instance = new fixtures.Class(fixtures.scope, fixtures.runtime, fixtures.registry)
})

it('should assign url', () => {
  instance.tag()

  assert.deepStrictEqual(instance.reference, `${fixtures.registry.base}/${fixtures.scope}/${fixtures.name}:${fixtures.version}`)
})

describe('prepare', () => {
  it('should throw error if no dockerfile specified', async () => {
    await assert.rejects(instance.prepare(generate()), (error) => /Dockerfile isn't specified/.test(error.message))
  })
})
