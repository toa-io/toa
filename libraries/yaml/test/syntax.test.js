'use strict'

const { resolve } = require('node:path')
const { generate } = require('randomstring')
const { load } = require('../source')

const path = resolve(__dirname, './examples/syntax.yaml')

let object

beforeAll(async () => {
  object = await load(path)
})

it('should be', () => {
  expect(object).toBeDefined()
})

it('should resolve anchor', () => {
  expect(object.context.local.do.reply).toStrictEqual(object.reply)

  object.context.local.do.reply.input = generate()

  expect(object.context.local.do.reply).not.toStrictEqual(object.reply)
})

it('should resolve anchor in multi-document files', async () => {
  const path = resolve(__dirname, './examples/syntax.multidoc.yaml')
  const objects = await load.all(path)
  const object = objects[0]

  expect(object.context.local.do.reply).toStrictEqual(object.reply)

  object.context.local.do.reply.input = generate()

  expect(object.context.local.do.reply).not.toStrictEqual(object.reply)
})
