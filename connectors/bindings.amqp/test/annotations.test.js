'use strict'

const { generate } = require('randomstring')
const mock = { proxy: generate() }

jest.mock('@toa.io/libraries/annotations', () => mock)
const { annotation } = require('../')

it('should export annotations', () => {
  expect(annotation).toBeDefined()
})

it('should export libraries.annotations.proxy', () => {
  expect(annotation).toStrictEqual(mock.proxy)
})
