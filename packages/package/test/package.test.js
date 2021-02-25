'use strict'

const path = require('path')

const { Package } = require('../src/package')
const assets = require('./package.assets')

let component

describe('Load', () => {
  beforeEach(async () => {
    const dir = path.resolve(assets.dummiesPath, 'simple')

    component = await Package.load(dir)
  })

  it('should load manifest', () => {
    expect(component.manifest).toEqual(assets.simple.manifest)
  })

  it('should load operations', () => {
    expect(component.algorithms).toEqual(expect.arrayContaining(assets.simple.algorithms))
  })
})

describe('Operations', () => {
  beforeEach(async () => {
    const dir = path.resolve(assets.dummiesPath, 'calculator')

    component = await Package.load(dir)
  })

  it('should load operations manifest', () => {
    expect(component.algorithms).toMatchObject(expect.arrayContaining(assets.calculator.algorithms))
  })
})
