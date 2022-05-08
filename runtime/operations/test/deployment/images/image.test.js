'use strict'

const fixtures = require('./image.fixtures')
const { generate } = require('randomstring')

/** @type {toa.operations.deployment.images.Image} */
let instance

beforeEach(() => {
  instance = new fixtures.Class(fixtures.runtime, fixtures.process)
})

it('should assign url', () => {
  const registry = generate()

  instance.tag(registry)

  expect(instance.url).toEqual(`${registry}/${fixtures.name}:${fixtures.key}`)
})

describe('prepare', () => {
  it('should throw error if no dockerfile specified', async () => {
    await expect(instance.prepare()).rejects.toThrow(/Dockerfile isn't specified/)
  })
})

describe('build', () => {
  it('should throw if not tagged', async () => {
    await expect(instance.build()).rejects.toThrow(/hasn't been tagged/)
  })
})
