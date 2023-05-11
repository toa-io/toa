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

it('should pass segments repeatedly', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn(() => ({}))
  const value = randomstring.generate()

  object = generate(generator)
  object.a.b = value

  expect(generator).toHaveBeenNthCalledWith(1, ['a'])
  expect(generator).toHaveBeenNthCalledWith(2, ['a', 'b'], value)

  object.a.b = value

  expect(generator).toHaveBeenNthCalledWith(3, ['a'])
  expect(generator).toHaveBeenNthCalledWith(4, ['a', 'b'], value)
})

it('should apply methods with the context', async () => {
  const generator = () => new Set()

  object = generate(generator)

  const size = object.a.size
  const values = object.a.values()

  expect(size).toStrictEqual(0)
  expect(Array.from(values)).toStrictEqual([])
})

it.each([
  ['Array', Array], ['Set', Set], ['Map', Map], ['Uint8Array', Uint8Array], ['null', null]
])('should not proxy %s', async (_, Type) => {
  const generator = /** @type {jest.MockedFn} */ jest.fn(() => Type?.constructor ? new Type() : Type)

  object = generate(generator)

  expect(object.a?.foo).toBeUndefined()
})

it('should not proxy primitive values', async () => {
  const generator = /** @type {jest.MockedFn} */ jest.fn(() => 1)

  object = generate(generator)

  expect(typeof object.a).toStrictEqual('number')
  expect(object.a?.foo).toBeUndefined()
})
