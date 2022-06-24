'use strict'

const { generate } = require('randomstring')
const mock = { proxy: generate() }

jest.mock('@toa.io/libraries/annotations', () => mock)
const { annotations } = require('../')

it('should export annotations', () => {
  expect(annotations).toBeDefined()
})

it('should export libraries.annotations.proxy', () => {
  expect(annotations).toStrictEqual(mock.proxy)
})
