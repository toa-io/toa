'use strict'

const { quantity } = require('../')

it('should be', async () => {
  expect(quantity).toBeDefined()
})

it('should decode k', async () => {
  const value = quantity('10kB')

  expect(value).toStrictEqual(10000)
})

it('should decode K', async () => {
  const value = quantity('2KB')

  expect(value).toStrictEqual(2048)
})

it('should decode Mi', async () => {
  const value = quantity('3MiB')

  expect(value).toStrictEqual(3 * 1024 * 1024)
})

it('should decode Ti', async () => {
  const value = quantity('3TiB')

  expect(value).toStrictEqual(3 * 1024 * 1024 * 1024 * 1024)
})

it('should decode float', async () => {
  const value = quantity('0.5MB')

  expect(value).toStrictEqual(0.5 * 1000 * 1000)
})

it('should decode plain number', async () => {
  const value = quantity('0.5')

  expect(value).toStrictEqual(0.5)
})

it('should throw if not quantity', async () => {
  expect(() => quantity('KB10')).toThrow('\'KB10\' doesn\'t look like a quantity of something')
})

it('should throw if multiplier not known', async () => {
  expect(() => quantity('10wB')).toThrow('\'wB\' doesn\'t look like a quantity unit')
})
