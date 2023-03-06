'use strict'

const { generate } = require('randomstring')
const { failsafe } = require('../')

it('should be', async () => {
  expect(failsafe).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()
})

const fn = /** @type {jest.MockedFunction} */ jest.fn(async () => generate())
const recover = jest.fn(async () => true)

class FailsafeTest {
  do = failsafe(this, this.#recover, async (...args) => {
    return fn(...args)
  })

  async #recover (exception) {
    return recover(exception)
  }
}

/** @type {FailsafeTest} */
let instance

beforeEach(() => {
  jest.clearAllMocks()

  instance = new FailsafeTest()
})

it('should run fn', async () => {
  await instance.do()

  expect(fn).toHaveBeenCalled()
})

it('should return value', async () => {
  const value = await instance.do()

  expect(value).toStrictEqual(await fn.mock.results[0].value)
})

it('should pass arguments', async () => {
  const args = [generate(), generate()]

  await instance.do(...args)

  expect(fn).toHaveBeenCalledWith(...args)
})

it('should recover on exception', async () => {
  fn.mockImplementationOnce(async () => { throw new Error() })

  const value = await instance.do()

  expect(value).toStrictEqual(await fn.mock.results[1].value)
})

it('should throw on recovery failure', async () => {
  const exception = generate()

  fn.mockImplementationOnce(async () => { throw exception })
  recover.mockImplementationOnce(async () => false)

  await expect(instance.do()).rejects.toStrictEqual(exception)
})

it('should pass exception to recover', async () => {
  const exception = generate()

  fn.mockImplementationOnce(async () => { throw exception })

  await instance.do()

  expect(recover).toHaveBeenCalledWith(exception)
})

it('should call recover within context', async () => {
  class Test {
    foo = 1

    do = failsafe(this, this.recover, fn)

    recover () {
      expect(this.foo).toStrictEqual(1)
    }
  }

  const instance = new Test()

  fn.mockImplementationOnce(() => { throw new Error() })

  instance.do()
})
