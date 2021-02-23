'use strict'

const path = require('path')

const { Package } = require('../src/package')
const assets = require('./package.assets')

let component
let expectedManifest
let expectedOperations

beforeEach(async () => {
  const dir = path.resolve(assets.dummiesPath, 'simple')

  component = await Package.load(dir)
  expectedManifest = await assets.loadExpectedManifest()
  expectedOperations = await assets.loadExpectedOperations()
})

describe('Load', () => {
  it('should load manifest', () => {
    expect(component.manifest).toEqual(expectedManifest)
  })

  it('should load operations', () => {
    expect(component.operations).toEqual(expect.arrayContaining(expectedOperations))
  })
})
