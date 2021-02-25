'use strict'

const path = require('path')

const { Package } = require('../src/package')
const assets = require('./package.assets')

let instance

describe('Load', () => {
  beforeEach(async () => {
    const dir = path.resolve(assets.dummiesPath, 'simple')

    instance = await Package.load(dir)
  })

  it('should load manifest', () => {
    expect(instance.locator).toEqual(assets.simple.locator)
  })

  it('should load operations', () => {
    expect(instance.algorithms).toMatchObject(assets.simple.algorithms)
  })
})

describe('Operations', () => {
  beforeEach(async () => {
    const dir = path.resolve(assets.dummiesPath, 'calculator')

    instance = await Package.load(dir)
  })

  it('should load operations manifest', () => {
    expect(instance.algorithms).toMatchObject(assets.calculator.algorithms)
  })
})
