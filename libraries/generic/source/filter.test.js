'use strict'

const { filter } = require('../')
const { immediate } = require('./immediate')

it('should be', async () => {
  expect(filter).toBeInstanceOf(Function)
})

it('should filter', async () => {
  async function test (value) {
    await immediate()
    return value === 'b'
  }

  const array = ['a', 'b']
  const output = await filter(array, test)

  expect(output).toStrictEqual(['b'])
})
