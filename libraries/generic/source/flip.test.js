'use strict'

const { flip } = require('../')

it('should be', async () => {
  expect(flip).toBeDefined()
})

it('should return true or false', async () => {
  let yeps = 0
  let nopes = 0

  for (let i = 0; i < 1000; i++) {
    const output = flip()

    expect(typeof output).toStrictEqual('boolean')

    if (output) yeps++
    else nopes++
  }

  const diff = Math.abs(yeps - nopes)

  // eh
  expect(diff).toBeLessThan(yeps)
  expect(diff).toBeLessThan(nopes)
})
