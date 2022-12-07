'use strict'

const { resolve } = require('node:path')

const { stage } = require('./stage.mock')
const mock = { stage }

jest.mock('@toa.io/userland/stage', () => mock.stage)

const { components } = require('../')

const path = resolve(__dirname, '../../example/components/math/calculations')
const paths = [path]

it('should be', () => {
  expect(components).toBeDefined()
})

beforeAll(async () => {
  await components(paths)
})

it('should boot composition', () => {
  expect(stage.composition).toHaveBeenCalled()
  expect(stage.composition).toHaveBeenCalledWith([path])
})

it('should shutdown stage', () => {
  expect(stage.shutdown).toHaveBeenCalled()
})
