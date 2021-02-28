'use strict'

const { Package } = require('../src/package')
const assets = require('./package.assets')

let instance

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Load', () => {
  beforeEach(async () => {
    instance = await Package.load(assets.simple.path)
  })

  it('should load manifest', () => {
    expect(instance.locator).toStrictEqual(expect.objectContaining(assets.simple.locator))
  })

  it('should load operations', () => {
    expect(instance.operations).toStrictEqual(expect.arrayContaining(assets.simple.operations))
  })
})

describe('Operations', () => {
  beforeEach(async () => {
    instance = await Package.load(assets.calculator.path)
  })

  it('should load operations manifest', () => {
    expect(instance.operations).toStrictEqual(expect.arrayContaining(assets.calculator.operations))
  })
})

describe('Errors', () => {
  it('should warn if no domain provided', async () => {
    await Package.load(assets.broken.paths.noDomain)

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('warn'),
      expect.stringContaining('domain')
    )
  })

  it('should throw if manifest .operations is not array', async () => {
    const load = async () => await Package.load(assets.broken.paths.operationsNotArray)

    await expect(load).rejects.toThrow(/must be an array/)
  })

  it('should throw if manifest .operations is defined and not array', async () => {
    const load = async () => await Package.load(assets.broken.paths.conflictingDeclaration)

    await expect(load).rejects.toThrow(/conflicts on key/)
  })
})
