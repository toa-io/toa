'use strict'

const path = require('path')

const { Package } = require('../src/package')
const assets = require('./package.assets')

let component
let expectedManifest
let expectedAlgorithms

beforeEach(async () => {
  const dir = path.resolve(assets.dummiesPath, 'simple')

  component = await Package.load(dir)
  expectedManifest = await assets.loadExpectedManifest()
  expectedAlgorithms = await assets.loadExpectedAlgorithms()
})

describe('Load', () => {
  it('should load manifest', () => {
    expect(component.manifest).toEqual(expectedManifest)
  })

  it('should load operations', () => {
    expect(component.algorithms).toEqual(expect.arrayContaining(expectedAlgorithms))
  })
})
