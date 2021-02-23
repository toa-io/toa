import path from 'path'

import Package from '../src/package'
import * as assets from './package.assets'

let component
let expectedManifest
let expectedOperations

beforeEach(async () => {
  const dir = path.resolve(assets.__dirname, './package.assets')

  component = await Package.load(dir, assets.options)
  expectedManifest = await assets.loadExpectedManifest()
  expectedOperations = await assets.loadExpectedOperations()
})

describe('Load', () => {
  it('should load manifest', () => {
    expect(component.manifest).toEqual(expectedManifest)
  })

  it('should load operations', () => {
    expect(component.operations).toEqual(expectedOperations)
  })
})
