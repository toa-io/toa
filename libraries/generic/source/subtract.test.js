'use strict'

const { subtract } = require('../')

it('should be', () => {
  expect(subtract).toBeDefined()
})

it('should subtract arrays', () => {
  const a = [1, 2, 3]
  const b = [2]
  const diff = subtract(a, b)

  expect(diff).toStrictEqual([1, 3])
})

it('should subtract superset', async () => {
  const a = [1]
  const b = [1, 2]
  const diff = subtract(a, b)

  expect(diff).toStrictEqual([])
})

it('should subtract sets', () => {
  const a = new Set([1, 2, 3])
  const b = new Set([2])
  const diff = subtract(a, b)

  expect(diff).toStrictEqual(new Set([1, 3]))
})

it('should subtract array from set', () => {
  const a = new Set([1, 2, 3])
  const b = [2]
  const diff = subtract(a, b)

  expect(diff).toStrictEqual(new Set([1, 3]))
})

it('should subtract set from array', () => {
  const a = [1, 2, 3]
  const b = new Set([2])
  const diff = subtract(a, b)

  expect(diff).toStrictEqual([1, 3])
})
