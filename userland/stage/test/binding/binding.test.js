'use strict'

const { properties, binding, Factory } = require('../../src').binding

it('should be async', async () => {
  expect(properties.async).toStrictEqual(true)
})

it('should export Factory', async () => {
  expect(Factory).toBeDefined()
})

it('should export binding instance', async () => {
  expect(binding).toBeDefined()
})
