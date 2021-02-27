'use strict'

const mockConsole = require('jest-mock-console')

const { Package } = require('../src/package')
const assets = require('./package.assets')

mockConsole()

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
    expect(instance.operations).toStrictEqual(assets.simple.operations)
  })

  it('should warn if no domain provided', async () => {
    await Package.load(assets.broken.noDomain.path)

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('warn'),
      expect.stringContaining('domain')
    )
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
