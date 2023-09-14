'use strict'

const fixtures = require('./image.fixtures')
const { generate } = require('randomstring')

/** @type {toa.deployment.images.Image} */
let instance

beforeEach(() => {
  instance = new fixtures.Class(fixtures.scope, fixtures.runtime, fixtures.registry)
})

it('should assign url', () => {
  instance.tag()

  expect(instance.reference).toEqual(`${fixtures.registry.base}/${fixtures.scope}/${fixtures.name}:${fixtures.version}`)
})

describe('prepare', () => {
  it('should throw error if no dockerfile specified', async () => {
    await expect(instance.prepare(generate())).rejects.toThrow(/Dockerfile isn't specified/)
  })
})
