'use strict'

const { Package } = require('../src/package')
const assets = require('./package.assets')

let instance

describe('Load', () => {
  beforeEach(async () => {
    instance = await Package.load(assets.simple.path)
  })

  it('should load manifest', () => {
    expect(instance.locator).toEqual(expect.objectContaining(assets.simple.locator))
  })

  it('should load operations', () => {
    expect(instance.operations).toEqual(assets.simple.operations)
  })
})

describe('Operations', () => {
  beforeEach(async () => {
    instance = await Package.load(assets.calculator.path)
  })

  it('should load operations manifest', () => {
    expect(instance.operations).toEqual(assets.calculator.operations)
  })
})
