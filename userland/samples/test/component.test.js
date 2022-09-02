'use strict'

const { resolve } = require('node:path')

const { stage } = require('./stage.mock')
const mock = { stage }

jest.mock('@toa.io/userland/stage', () => mock.stage)

const { component } = require('../')

const path = resolve(__dirname, '../../example/components/math/calculations')

it('should be', () => {
  expect(component).toBeDefined()
})

beforeAll(async () => {
  await component(path)
})

it('should boot composition', () => {
  expect(stage.composition).toHaveBeenCalled()
  expect(stage.composition).toHaveBeenCalledWith([path])
})

it('should shutdown stage', () => {
  expect(stage.shutdown).toHaveBeenCalled()
})
