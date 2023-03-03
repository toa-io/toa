'use strict'

const { generate } = require('randomstring')
const { failsafe } = require('../')

it('should be', async () => {
  expect(failsafe).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()
})

const fn = jest.fn(async () => generate())
const recover = jest.fn(async () => true)

it('should run fn', async () => {
  await failsafe(fn, recover)

  expect(fn).toHaveBeenCalled()
})

it('should return value', async () => {
  const value = await failsafe(fn, recover)

  expect(value).toStrictEqual(await fn.mock.results[0].value)
})

it('should recover on exception', async () => {
  fn.mockImplementationOnce(async () => { throw new Error() })

  const value = await failsafe(fn, recover)

  expect(value).toStrictEqual(await fn.mock.results[1].value)
})

it('should throw on recovery failure', async () => {
  const exception = generate()

  fn.mockImplementationOnce(async () => { throw exception })
  recover.mockImplementationOnce(async () => false)

  await expect(failsafe(fn, recover)).rejects.toStrictEqual(exception)
})

it('should pass exception to recover', async () => {
  const exception = generate()

  fn.mockImplementationOnce(async () => { throw exception })

  await failsafe(fn, recover)

  expect(recover).toHaveBeenCalledWith(exception)
})
