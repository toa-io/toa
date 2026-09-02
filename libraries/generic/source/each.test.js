import { it } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { generate } from 'randomstring'
import { each, immediate } from '../source/index.js'

it('should be', async () => {
  assert.ok(each instanceof Function)
})

it('should iterate', async () => {
  const arr = [generate(), generate()]

  
  each(arr, (element, index) => {
    assert.deepStrictEqual(element, arr[index])
  })
})

it('should await', async () => {
  /** @type {string[]} */
  const arr = [generate(), generate()]

  
  await each(arr, async (element, index) => {
    await immediate()

    assert.deepStrictEqual(element, arr[index])
  })
})

it('should update values', () => {
  const arr = [1, 2, 3]

  each(arr, (n, index) => n + index)

  assert.ok([1, 3, 5].every((item) => arr.some((candidate) => isDeepStrictEqual(candidate, item))))
})

it('should update partially', () => {
  const arr = [1, 2, 3]

  each(arr, (n, index) => { if (index === 1) return 10 })

  assert.ok([1, 10, 3].every((item) => arr.some((candidate) => isDeepStrictEqual(candidate, item))))
})

it('should update values with async callback', async () => {
  const arr = [1, 2, 3]

  await each(arr, async (n, index) => n + index)

  assert.ok([1, 3, 5].every((item) => arr.some((candidate) => isDeepStrictEqual(candidate, item))))
})
