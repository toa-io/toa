'use strict'

const { generate } = require('randomstring')
const { each, immediate } = require('../')

it('should be', async () => {
  expect(each).toBeInstanceOf(Function)
})

it('should iterate', async () => {
  const arr = [generate(), generate()]

  expect.assertions(arr.length)

  each(arr, (element, index) => {
    expect(element).toStrictEqual(arr[index])
  })
})

it('should await', async () => {
  /** @type {string[]} */
  const arr = [generate(), generate()]

  expect.assertions(arr.length)

  await each(arr, async (element, index) => {
    await immediate()

    expect(element).toStrictEqual(arr[index])
  })
})

it('should update values', () => {
  const arr = [1, 2, 3]

  each(arr, (n, index) => n + index)

  expect(arr).toStrictEqual(expect.arrayContaining([1, 3, 5]))
})

it('should update partially', () => {
  const arr = [1, 2, 3]

  each(arr, (n, index) => { if (index === 1) return 10 })

  expect(arr).toStrictEqual(expect.arrayContaining([1, 10, 3]))
})

it('should update values with async callback', async () => {
  const arr = [1, 2, 3]

  await each(arr, async (n, index) => n + index)

  expect(arr).toStrictEqual(expect.arrayContaining([1, 3, 5]))
})
