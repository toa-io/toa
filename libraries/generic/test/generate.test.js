'use strict'

const randomstring = require('randomstring')
const { generate } = require('../')

it('should be', async () => {
  expect(generate).toBeInstanceOf(Function)
})

let object

it('should call generator', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn(() => randomstring.generate())

  object = generate(generator)

  const prop = randomstring.generate()
  const value = object[prop]

  expect(generator).toHaveBeenCalled()
  expect(value).toStrictEqual(generator.mock.results[0].value)
})

it('should pass segments', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn()

  generator.mockImplementationOnce(() => ({}))
  generator.mockImplementationOnce(() => 1)
  object = generate(generator)

  const value = object.a.b

  expect(generator).toHaveBeenCalledTimes(2)
  expect(generator).toHaveBeenNthCalledWith(2, ['a', 'b'])
  expect(value).toStrictEqual(generator.mock.results[1].value)
})

it('should pass value', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn(() => undefined)

  object = generate(generator)

  const prop = randomstring.generate()
  const value = randomstring.generate()

  object[prop] = value

  expect(generator).toHaveBeenCalledWith([prop], value)
})

it('should pass segments and value', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn()
  const value = randomstring.generate()

  generator.mockImplementationOnce(() => ({}))
  object = generate(generator)

  object.a.b = value

  expect(generator).toHaveBeenCalledWith(['a', 'b'], value)
})
