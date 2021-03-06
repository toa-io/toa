'use strict'

jest.mock('../src/validate')

const { Package } = require('../src/package')
const fixtures = require('./package.fixtures')

const validate = require('../src/validate')

let instance

beforeEach(() => {
  jest.clearAllMocks()
})

describe('load', () => {
  beforeEach(async () => {
    instance = await Package.load(fixtures.path)
  })

  it('should provide locator', () => {
    expect(instance.locator).toStrictEqual(expect.objectContaining(fixtures.locator))
  })

  it('should provide operations', () => {
    expect(instance.operations).toStrictEqual(expect.arrayContaining(fixtures.operations))
  })

  it('should provide state', () => {
    expect(instance.state).toStrictEqual(fixtures.state)
  })

  it('should validate manifest', async () => {
    expect(validate.manifest).toHaveBeenCalledTimes(1)
  })
})
