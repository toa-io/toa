'use strict'

const { defined } = require('../src/defined')

it('should remove undefined properties', () => {
  const object = { foo: 1, bar: undefined }

  expect(Object.prototype.hasOwnProperty.call(object, 'bar')).toBeTruthy()

  const result = defined(object)

  expect(Object.prototype.hasOwnProperty.call(object, 'bar')).toBeFalsy()
  expect(result).toBe(object)
})
