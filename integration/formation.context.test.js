'use strict'

const { resolve } = require('node:path')
const { context: load } = require('@toa.io/formation')

const path = resolve(__dirname, './context/')
const environment = 'dev'

let context

beforeAll(async () => {
  context = await load(path, environment)
})

it('should load', async () => {
  expect(context).toBeDefined()
  expect(context.components.length).toBeGreaterThan(0)
  expect(Object.keys(context.dependencies).length).toBeGreaterThan(0)
})

it('should convolve with given environment', () => {
  expect(context.registry.platforms).toStrictEqual(null)
})
