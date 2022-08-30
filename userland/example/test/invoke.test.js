'use strict'

const { resolve } = require('node:path')
const stage = require('@toa.io/userland/staging')

const root = resolve(__dirname, '../components')

/** @type {toa.core.Component} */
let component

beforeAll(async () => {
  const path = resolve(root, 'math.calculations')

  component = await stage.component(path)
})

afterAll(async () => {
  await stage.shutdown()
})

it('should ok', async () => {
  const result = await component.invoke('sum', { input: { a: 1, b: 2 } })

  expect(result.output).toStrictEqual(3)
})
