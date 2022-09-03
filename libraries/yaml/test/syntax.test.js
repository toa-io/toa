'use strict'

const { resolve } = require('node:path')
const { load } = require('../src')

const path = resolve(__dirname, 'syntax.yaml')

let object

beforeAll(async () => {
  object = await load(path)
})

it('should be', () => {
  expect(object).toBeDefined()
})

it('should resolve anchor', () => {
  expect(object.context.local.do.reply).toStrictEqual(object.reply)
})
