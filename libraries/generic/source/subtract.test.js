'use strict'

const { it } = require('node:test')
const assert = require('node:assert/strict')

const { subtract } = require('../')

it('should be', () => {
  assert.notStrictEqual(subtract, undefined)
})

it('should subtract arrays', () => {
  const a = [1, 2, 3]
  const b = [2]
  const diff = subtract(a, b)

  assert.deepStrictEqual(diff, [1, 3])
})

it('should subtract superset', async () => {
  const a = [1]
  const b = [1, 2]
  const diff = subtract(a, b)

  assert.deepStrictEqual(diff, [])
})

it('should subtract sets', () => {
  const a = new Set([1, 2, 3])
  const b = new Set([2])
  const diff = subtract(a, b)

  assert.deepStrictEqual(diff, new Set([1, 3]))
})

it('should subtract array from set', () => {
  const a = new Set([1, 2, 3])
  const b = [2]
  const diff = subtract(a, b)

  assert.deepStrictEqual(diff, new Set([1, 3]))
})

it('should subtract set from array', () => {
  const a = [1, 2, 3]
  const b = new Set([2])
  const diff = subtract(a, b)

  assert.deepStrictEqual(diff, [1, 3])
})
