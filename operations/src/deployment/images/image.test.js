import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import * as fixtures from './image.fixtures.js'
import { generate } from 'randomstring'

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
