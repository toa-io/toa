'use strict'

jest.mock('../src/validation')

const { Package } = require('../src/package')
const fixtures = require('./package.fixtures')

const validate = require('../src/validation')

let instance

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Load', () => {
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
})

describe('Validation', () => {
  beforeEach(async () => {
    instance = await Package.load(fixtures.path)
  })

  it('should validate manifest', async () => {
    expect(validate.manifest).toHaveBeenCalledTimes(1)
  })

  it('should validate operations', async () => {
    fixtures.operations.forEach((operation, index) => {
      expect(validate.operation.mock.calls[index][0]).toStrictEqual(operation)
    })
  })
})
