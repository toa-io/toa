'use strict'

const { Package } = require('../src/package')
const fixtures = require('./package.fixtures')

let instance

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Load', () => {
  beforeEach(async () => {
    instance = await Package.load(fixtures.simple.path)
  })

  it('should load manifest', () => {
    expect(instance.locator).toStrictEqual(expect.objectContaining(fixtures.simple.locator))
  })

  it('should load operations', () => {
    expect(instance.operations).toStrictEqual(expect.arrayContaining(fixtures.simple.operations))
  })
})

describe('Operations', () => {
  beforeEach(async () => {
    instance = await Package.load(fixtures.calculator.path)
  })

  it('should load operations manifest', () => {
    expect(instance.operations).toStrictEqual(expect.arrayContaining(fixtures.calculator.operations))
  })
})

describe('Errors', () => {
  it('should warn if no domain provided', async () => {
    await Package.load(fixtures.broken.paths.noDomain)

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('warn'),
      expect.stringContaining('domain')
    )
  })

  it('should throw if manifest .operations is not array', async () => {
    const load = async () => await Package.load(fixtures.broken.paths.operationsNotArray)

    await expect(load).rejects.toThrow(/must be an array/)
  })

  it('should throw if manifest .operations is defined and not array', async () => {
    const load = async () => await Package.load(fixtures.broken.paths.conflictingDeclaration)

    await expect(load).rejects.toThrow(/conflicts on key/)
  })
})
