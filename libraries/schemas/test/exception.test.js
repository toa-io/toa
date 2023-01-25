'use strict'

const { generate } = require('randomstring')
const { Exception } = require('../')

it('should be', async () => {
  expect(Exception).toBeDefined()
})

/** @type {toa.schemas.Error} */
const error = {
  message: generate(),
  keyword: generate(),
  schema: generate(),
  property: generate(),
  path: generate()
}

/** @type {Exception} */
let exception

beforeEach(() => {
  exception = new Exception(error)
})

it('should be instance of TypeError', async () => {
  expect(exception).toBeInstanceOf(TypeError)
})

it.each(Object.keys(error))('should expose %s', (key) => {
  expect(exception[key]).toStrictEqual(error[key])
})
