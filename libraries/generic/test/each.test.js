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
