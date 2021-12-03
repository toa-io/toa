'use strict'

const { resolve } = require('node:path')
const { context: load } = require('@toa.io/package')

const path = resolve(__dirname, './context/')

let context

beforeAll(async () => {
  context = await load(path)
})

it('should load', async () => {
  expect(context).toBeDefined()
  expect(context.manifests.length).toBeGreaterThan(0)
  expect(Object.keys(context.connectors).length).toBeGreaterThan(0)
  expect(Object.keys(context.extensions).length).toBeGreaterThan(0)
})
