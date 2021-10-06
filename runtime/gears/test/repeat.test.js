'use strict'

const { repeat } = require('../src/repeat')
const { generate } = require('randomstring')
const { random } = require('../src/random')

it('should repeat', () => {
  const fn = jest.fn()

  repeat(fn, 10)

  expect(fn).toHaveBeenCalledTimes(10)
})

it('should return results', () => {
  const times = random(10)

  expect.assertions(times)

  const fn = jest.fn(() => generate())
  const results = repeat(fn, times)

  fn.mock.results.map((result, i) => expect(results[i]).toBe(result.value))
})

it('should return promises', async () => {
  const times = 10

  expect.assertions(times + 1)

  const fn = jest.fn(async () => generate())
  const promise = repeat(fn, times)

  expect(promise).toBeInstanceOf(Promise)

  const results = await promise

  for (let i = 0; i < fn.mock.results.length; i++) {
    expect(results[i]).toBe(await fn.mock.results[i].value)
  }
})
