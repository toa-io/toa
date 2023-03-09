'use strict'

const { random } = require('../source/random')

it('should be less than or equal to ceil(max)', () => {
  const iterations = 100

  expect.assertions(iterations)

  for (let i = iterations; i > 0; i--) {
    const max = Math.ceil(Math.random() * i)
    const value = random(max)

    expect(value).toBeLessThanOrEqual(max)
  }
})

it('should be integer', () => {
  const value = random(10)

  expect(value % 1).toBe(0)
})

it('should be less than 100 by default', () => {
  const iterations = 100

  expect.assertions(iterations)

  for (let i = iterations; i > 0; i--) {
    const value = random()

    expect(value).toBeLessThanOrEqual(100)
  }
})
